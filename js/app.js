import {
  AVAILABILITY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TERMINAL_STATUSES,
  formatDate,
  formatLocation,
  loadJobs,
  validateJob
} from './jobs.js';
import { filterJobs, sortJobs } from './filters.js';
import { createJobsMap } from './map.js';

const els = {
  summaryCards: document.getElementById('summaryCards'),
  jobsTableBody: document.getElementById('jobsTableBody'),
  statusFilter: document.getElementById('statusFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  availabilityFilter: document.getElementById('availabilityFilter'),
  companyFilter: document.getElementById('companyFilter'),
  locationFilter: document.getElementById('locationFilter'),
  tagFilter: document.getElementById('tagFilter'),
  searchInput: document.getElementById('searchInput'),
  sortBy: document.getElementById('sortBy'),
  resetFilters: document.getElementById('resetFilters'),
  jobDetailTitle: document.getElementById('jobDetailTitle'),
  jobDetailBody: document.getElementById('jobDetailBody')
};

let jobs = [];
let filteredJobs = [];
let jobsMap;
let detailsModal;

function createBadge(label, className) {
  const badge = document.createElement('span');
  badge.className = `badge badge-soft ${className}`;
  badge.textContent = label;
  return badge;
}

function statusClass(status) {
  return TERMINAL_STATUSES.has(status) ? 'badge-status-terminal' : 'badge-status-active';
}

function renderSummaryCards(currentJobs) {
  const interviews = currentJobs.filter((job) =>
    ['hr_screen', 'technical_interview', 'final_interview'].includes(job.status)
  ).length;

  const cards = [
    { title: 'Tracked Jobs', value: currentJobs.length },
    {
      title: 'Not Applied',
      value: currentJobs.filter((job) => !job.applicationDate).length
    },
    {
      title: 'Active Applications',
      value: currentJobs.filter((job) => !TERMINAL_STATUSES.has(job.status)).length
    },
    { title: 'Interviews', value: interviews },
    { title: 'Offers', value: currentJobs.filter((job) => job.status === 'offer').length }
  ];

  els.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <div class="col-sm-6 col-lg-3">
          <div class="card summary-card h-100 shadow-sm">
            <div class="card-body">
              <h2 class="h6 text-secondary">${card.title}</h2>
              <p class="display-6 mb-0">${card.value}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderTable(currentJobs) {
  els.jobsTableBody.innerHTML = '';

  if (currentJobs.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" class="text-center py-4">No jobs match the current filters.</td>';
    els.jobsTableBody.appendChild(row);
    return;
  }

  currentJobs.forEach((job) => {
    const row = document.createElement('tr');
    row.className = 'job-row';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `Open details for ${job.company} ${job.position}`);

    const submittedDocuments = job.documents.filter((document) => document.submitted).length;

    row.appendChild(cellWithNode(createBadge(PRIORITY_LABELS[job.priority], `badge-priority-${job.priority}`)));
    row.appendChild(textCell(job.company));
    row.appendChild(textCell(job.position));
    row.appendChild(textCell(formatLocation(job.location)));
    row.appendChild(cellWithNode(createBadge(AVAILABILITY_LABELS[job.availability], `badge-availability-${job.availability}`)));
    row.appendChild(cellWithNode(createBadge(STATUS_LABELS[job.status], statusClass(job.status))));
    row.appendChild(textCell(formatDate(job.applicationDate)));
    row.appendChild(textCell(formatDate(job.lastUpdate)));
    row.appendChild(textCell(`${submittedDocuments}/${job.documents.length}`));

    const open = () => openJobDetails(job.id);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    els.jobsTableBody.appendChild(row);
  });
}

function textCell(value) {
  const td = document.createElement('td');
  td.textContent = value || '—';
  return td;
}

function cellWithNode(node) {
  const td = document.createElement('td');
  td.appendChild(node);
  return td;
}

function createLink(url, label) {
  if (!url) {
    return '—';
  }
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderDetails(job) {
  const timeline = [...job.timeline].sort((a, b) => Date.parse(a.date || 0) - Date.parse(b.date || 0));
  const documentsHtml = job.documents.length
    ? job.documents
        .map((document) => {
          const symbol = document.submitted ? '✓' : '○';
          const link = document.url ? ` — <a href="${document.url}" target="_blank" rel="noopener noreferrer">Open</a>` : '';
          const version = document.version ? ` (${document.version})` : '';
          return `<li>${symbol} ${document.name}${version}${link}</li>`;
        })
        .join('')
    : '<li>No documents listed.</li>';

  const contactsHtml = job.contacts.length
    ? job.contacts
        .map(
          (contact) => `
          <li>
            <strong>${contact.name}</strong>
            ${contact.role ? `— ${contact.role}` : ''}
            ${contact.relation ? `(${contact.relation})` : ''}
          </li>`
        )
        .join('')
    : '<li>No contacts listed.</li>';

  const timelineHtml = timeline.length
    ? timeline
        .map(
          (entry) => `
          <div class="timeline-item">
            <div class="small text-secondary">${formatDate(entry.date)}</div>
            <div>${entry.description || '—'}</div>
          </div>
        `
        )
        .join('')
    : '<p class="mb-0">No timeline entries.</p>';

  return `
    <div class="row g-3 mb-3">
      <div class="col-md-6"><strong>Company:</strong> ${job.company}</div>
      <div class="col-md-6"><strong>Position:</strong> ${job.position}</div>
      <div class="col-md-6"><strong>Location:</strong> ${formatLocation(job.location)}</div>
      <div class="col-md-6"><strong>Priority:</strong> ${PRIORITY_LABELS[job.priority]}</div>
      <div class="col-md-6"><strong>Availability:</strong> ${AVAILABILITY_LABELS[job.availability]}</div>
      <div class="col-md-6"><strong>Status:</strong> ${STATUS_LABELS[job.status]}</div>
      <div class="col-md-6"><strong>Job Posting:</strong> ${createLink(job.jobUrl, 'Open posting')}</div>
      <div class="col-md-6"><strong>Company Website:</strong> ${createLink(job.companyUrl, 'Open website')}</div>
      <div class="col-md-6"><strong>Application Date:</strong> ${formatDate(job.applicationDate)}</div>
      <div class="col-md-6"><strong>Last Update:</strong> ${formatDate(job.lastUpdate)}</div>
    </div>

    <section class="mb-3">
      <h3 class="h6">Documents</h3>
      <ul>${documentsHtml}</ul>
    </section>

    <section class="mb-3">
      <h3 class="h6">Contacts</h3>
      <ul>${contactsHtml}</ul>
    </section>

    <section class="mb-3">
      <h3 class="h6">Timeline</h3>
      ${timelineHtml}
    </section>

    <section>
      <h3 class="h6">Notes</h3>
      <div class="notes-block">${job.notes || '—'}</div>
    </section>
  `;
}

function openJobDetails(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) {
    return;
  }

  els.jobDetailTitle.textContent = `${job.company} — ${job.position}`;
  els.jobDetailBody.innerHTML = renderDetails(job);
  detailsModal.show();
}

function optionsFromValues(values, allLabel = 'All') {
  return ['all', ...values].map((value) => ({
    value,
    label: value === 'all' ? allLabel : value
  }));
}

function populateSelect(select, options, labelMap = null) {
  select.innerHTML = '';
  options.forEach((option) => {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = labelMap?.[option.value] || option.label;
    select.appendChild(item);
  });
}

function collectCriteria() {
  return {
    search: els.searchInput.value,
    status: els.statusFilter.value,
    priority: els.priorityFilter.value,
    availability: els.availabilityFilter.value,
    company: els.companyFilter.value,
    location: els.locationFilter.value,
    tag: els.tagFilter.value
  };
}

function refreshView() {
  const criteria = collectCriteria();
  filteredJobs = sortJobs(filterJobs(jobs, criteria), els.sortBy.value);
  renderSummaryCards(filteredJobs);
  renderTable(filteredJobs);
  jobsMap.renderMarkers(filteredJobs);
}

function bindEvents() {
  [
    els.searchInput,
    els.statusFilter,
    els.priorityFilter,
    els.availabilityFilter,
    els.companyFilter,
    els.locationFilter,
    els.tagFilter,
    els.sortBy
  ].forEach((element) => {
    element.addEventListener('input', refreshView);
    element.addEventListener('change', refreshView);
  });

  els.resetFilters.addEventListener('click', () => {
    els.searchInput.value = '';
    els.statusFilter.value = 'all';
    els.priorityFilter.value = 'all';
    els.availabilityFilter.value = 'all';
    els.companyFilter.value = 'all';
    els.locationFilter.value = 'all';
    els.tagFilter.value = 'all';
    els.sortBy.value = 'lastUpdate_desc';
    refreshView();
  });
}

function renderValidationIssues(normalizedJobs) {
  const invalidJobs = normalizedJobs
    .map((job) => ({ id: job.id, issues: validateJob(job) }))
    .filter((item) => item.issues.length > 0);

  if (invalidJobs.length > 0) {
    console.warn('Some jobs have validation issues and fallback values were applied:', invalidJobs);
  }
}

function populateFilters(normalizedJobs) {
  const companies = [...new Set(normalizedJobs.map((job) => job.company).filter(Boolean))].sort();
  const locations = [
    ...new Set(normalizedJobs.map((job) => `${job.location?.city || ''}, ${job.location?.country || ''}`.replace(/^, |, $/g, '').trim()).filter(Boolean))
  ].sort();
  const tags = [...new Set(normalizedJobs.flatMap((job) => job.tags || []).filter(Boolean))].sort();

  populateSelect(els.statusFilter, optionsFromValues(Object.keys(STATUS_LABELS)), STATUS_LABELS);
  populateSelect(els.priorityFilter, optionsFromValues(Object.keys(PRIORITY_LABELS)), PRIORITY_LABELS);
  populateSelect(els.availabilityFilter, optionsFromValues(Object.keys(AVAILABILITY_LABELS)), AVAILABILITY_LABELS);
  populateSelect(els.companyFilter, optionsFromValues(companies));
  populateSelect(els.locationFilter, optionsFromValues(locations));
  populateSelect(els.tagFilter, optionsFromValues(tags));
}

async function initialize() {
  detailsModal = new bootstrap.Modal(document.getElementById('jobDetailModal'));
  jobsMap = createJobsMap('jobsMap', openJobDetails);

  try {
    jobs = await loadJobs();
    renderValidationIssues(jobs);

    populateFilters(jobs);
    bindEvents();
    refreshView();
  } catch (error) {
    console.error(error);
    els.jobsTableBody.innerHTML = '<tr><td colspan="9" class="text-danger py-4 text-center">Failed to load jobs data. Check data/jobs.json.</td></tr>';
  }
}

initialize();
