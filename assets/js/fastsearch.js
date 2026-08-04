import * as params from '@params';

const resList = document.getElementById('searchResults');
const sInput = document.getElementById('searchInput');
const searchBox = document.getElementById('searchbox');

let indexData = [];
let fuse;
let currentElement = null;
let firstResult = null;
let lastResult = null;

const SNIPPET_RADIUS = 48;
const MAX_RESULTS = 15;

const defaultFuseOptions = {
    distance: 100,
    threshold: 0.3,
    ignoreLocation: true,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 1,
    keys: [
        { name: 'title', weight: 0.4 },
        { name: 'summary', weight: 0.25 },
        { name: 'tags', weight: 0.15 },
        { name: 'content', weight: 0.2 }
    ]
};

const buildFuseOptions = () => {
    if (!params.fuseOpts) {
        return defaultFuseOptions;
    }

    return {
        isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
        includeScore: params.fuseOpts.includescore ?? true,
        includeMatches: params.fuseOpts.includematches ?? true,
        minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
        shouldSort: params.fuseOpts.shouldsort ?? true,
        findAllMatches: params.fuseOpts.findallmatches ?? true,
        keys: params.fuseOpts.keys ?? defaultFuseOptions.keys,
        location: params.fuseOpts.location ?? 0,
        threshold: params.fuseOpts.threshold ?? defaultFuseOptions.threshold,
        distance: params.fuseOpts.distance ?? defaultFuseOptions.distance,
        ignoreLocation: params.fuseOpts.ignorelocation ?? defaultFuseOptions.ignoreLocation
    };
};

const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value) => (value ?? '').toLowerCase();

const fieldRank = {
    title: 0,
    tags: 1,
    summary: 2,
    content: 3
};

const findMatchingFields = (item, query) => {
    const normalizedQuery = normalize(query);
    const matches = [];

    for (const field of ['title', 'tags', 'summary', 'content']) {
        const text = item[field];
        if (!text) {
            continue;
        }

        const normalizedText = normalize(text);
        const index = normalizedText.indexOf(normalizedQuery);
        if (index !== -1) {
            matches.push({
                field,
                text,
                indices: [[index, index + query.length - 1]]
            });
        }
    }

    return matches;
};

const getBestRank = (matches) => Math.min(...matches.map((match) => fieldRank[match.field] ?? 99));

const pickSnippetField = (matches) => {
    const snippetPriority = ['content', 'summary', 'tags', 'title'];

    for (const field of snippetPriority) {
        const match = matches.find((entry) => entry.field === field);
        if (match) {
            return match;
        }
    }

    return matches[0];
};

const buildSnippet = (text, query, indices) => {
    if (!text) {
        return '';
    }

    const normalized = normalize(text);
    const normalizedQuery = normalize(query);
    let start = normalized.indexOf(normalizedQuery);

    if (start === -1 && indices.length > 0) {
        start = indices[0][0];
    }

    if (start === -1) {
        const preview = text.slice(0, SNIPPET_RADIUS * 2).trim();
        return preview.length < text.length ? `${preview}...` : preview;
    }

    const sliceStart = Math.max(0, start - SNIPPET_RADIUS);
    const sliceEnd = Math.min(text.length, start + query.length + SNIPPET_RADIUS);
    let snippet = text.slice(sliceStart, sliceEnd).replace(/\s+/g, ' ').trim();

    if (sliceStart > 0) {
        snippet = `...${snippet}`;
    }
    if (sliceEnd < text.length) {
        snippet = `${snippet}...`;
    }

    return snippet;
};

const highlightSnippet = (snippet, query) => {
    if (!snippet || !query) {
        return snippet;
    }

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return snippet.replace(regex, '<mark class="search-hit">$1</mark>');
};

const reset = () => {
    currentElement = null;
    firstResult = null;
    lastResult = null;
    resList.innerHTML = '';
    sInput.value = '';
    sInput.focus();
};

const setActiveResult = (element) => {
    document.querySelectorAll('.focus').forEach((item) => item.classList.remove('focus'));

    if (!element) {
        return;
    }

    element.focus();
    element.parentElement?.classList.add('focus');
    currentElement = element;
};

const searchIndex = (query) => {
    const trimmed = query.trim();
    if (!trimmed || indexData.length === 0) {
        return [];
    }

    const exactMatches = [];

    for (const item of indexData) {
        const matches = findMatchingFields(item, trimmed);
        if (matches.length === 0) {
            continue;
        }

        exactMatches.push({
            item,
            matches,
            rank: getBestRank(matches),
            snippetField: pickSnippetField(matches)
        });
    }

    exactMatches.sort((left, right) => {
        if (left.rank !== right.rank) {
            return left.rank - right.rank;
        }

        return left.item.title.localeCompare(right.item.title, 'zh-CN');
    });

    if (exactMatches.length > 0) {
        return exactMatches.slice(0, MAX_RESULTS);
    }

    if (!fuse) {
        return [];
    }

    const searchLimit = params.fuseOpts?.limit ?? 50;
    return fuse.search(trimmed, { limit: searchLimit })
        .slice(0, MAX_RESULTS)
        .map((result) => {
            const matches = findMatchingFields(result.item, trimmed);
            return {
                item: result.item,
                matches,
                rank: matches.length > 0 ? getBestRank(matches) : 99,
                snippetField: matches.length > 0
                    ? pickSnippetField(matches)
                    : { field: 'summary', text: result.item.summary || result.item.content || result.item.title || '', indices: result.matches?.[0]?.indices ?? [] }
            };
        });
};

const renderResults = (results, query) => {
    if (!Array.isArray(results) || results.length === 0) {
        resList.innerHTML = '';
        firstResult = lastResult = currentElement = null;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const result of results) {
        const match = result.snippetField;
        const snippet = buildSnippet(match.text, query, match.indices);
        const highlightedSnippet = highlightSnippet(snippet, query);

        const li = document.createElement('li');
        li.className = 'search-result';

        const body = document.createElement('div');
        body.className = 'search-result__body';

        const title = document.createElement('div');
        title.className = 'search-result__title';
        title.textContent = result.item.title;

        const excerpt = document.createElement('div');
        excerpt.className = 'search-result__snippet';
        excerpt.innerHTML = highlightedSnippet;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.classList.add('feather', 'feather-chevrons-right', 'search-result__icon');
        svg.innerHTML = '<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>';

        const link = document.createElement('a');
        link.className = 'entry-link';
        link.href = result.item.permalink;
        link.setAttribute('aria-label', result.item.title);

        body.appendChild(title);
        if (highlightedSnippet) {
            body.appendChild(excerpt);
        }

        li.appendChild(body);
        li.appendChild(svg);
        li.appendChild(link);
        fragment.appendChild(li);
    }

    resList.innerHTML = '';
    resList.appendChild(fragment);
    firstResult = resList.firstElementChild;
    lastResult = resList.lastElementChild;
};

const performSearch = () => {
    const query = sInput.value.trim();
    if (!query) {
        renderResults([], query);
        return;
    }

    renderResults(searchIndex(query), query);
};

const initSearch = async () => {
    if (!sInput || !resList) {
        return;
    }

    sInput.disabled = false;
    sInput.focus();

    try {
        const response = await fetch('../index.json');
        if (!response.ok) {
            throw new Error(`Search index load failed: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
            indexData = data;
            fuse = new Fuse(data, buildFuseOptions());
        }
    } catch (error) {
        console.error(error);
    }
};

window.addEventListener('load', initSearch);

sInput?.addEventListener('input', debounce(performSearch, 150));

sInput?.addEventListener('search', () => {
    if (!sInput.value) {
        reset();
    }
});

document.addEventListener('keydown', (event) => {
    const { key } = event;
    const active = document.activeElement;
    const isInSearchBox = searchBox?.contains(active);

    if (key === 'Escape') {
        reset();
        return;
    }

    if (!firstResult || !isInSearchBox) {
        return;
    }

    if (key === 'ArrowDown') {
        event.preventDefault();

        if (active === sInput) {
            setActiveResult(firstResult.querySelector('.entry-link'));
        } else if (active?.parentElement !== lastResult) {
            setActiveResult(active?.parentElement?.nextElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowUp') {
        event.preventDefault();

        if (active?.parentElement === firstResult) {
            setActiveResult(sInput);
        } else if (active !== sInput) {
            setActiveResult(active?.parentElement?.previousElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowRight') {
        if (active?.matches?.('.entry-link')) {
            active.click();
        }
    }
});
