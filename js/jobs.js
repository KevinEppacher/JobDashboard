export const STATUS_LABELS = {
  interested: 'Interested',
  preparing: 'Preparing',
  applied: 'Applied',
  hr_screen: 'HR Screen',
  technical_interview: 'Technical Interview',
  final_interview: 'Final Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  closed: 'Closed'
};

export const TERMINAL_STATUSES = new Set(['rejected', 'withdrawn', 'closed']);

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

export const AVAILABILITY_LABELS = {
  available: 'Available',
  unknown: 'Unknown',
  closed: 'Closed'
};

const VALID_PRIORITIES = new Set(Object.keys(PRIORITY_LABELS));
const VALID_STATUSES = new Set(Object.keys(STATUS_LABELS));
const VALID_AVAILABILITIES = new Set(Object.keys(AVAILABILITY_LABELS));

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isValidDate(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function normalizeLocation(location = {}) {
  const city = typeof location.city === 'string' ? location.city : '';
  const country = typeof location.country === 'string' ? location.country : '';
  const latitude = typeof location.latitude === 'number' ? location.latitude : null;
  const longitude = typeof location.longitude === 'number' ? location.longitude : null;

  return { city, country, latitude, longitude };
}

function normalizeDocument(document = {}) {
  return {
    type: typeof document.type === 'string' ? document.type : 'document',
    name: typeof document.name === 'string' ? document.name : 'Unnamed document',
    submitted: Boolean(document.submitted),
    version: typeof document.version === 'string' ? document.version : '',
    url: typeof document.url === 'string' ? document.url : null
  };
}

function normalizeContact(contact = {}) {
  return {
    name: typeof contact.name === 'string' ? contact.name : 'Unknown contact',
    role: typeof contact.role === 'string' ? contact.role : '',
    relation: typeof contact.relation === 'string' ? contact.relation : ''
  };
}

function normalizeTimelineEntry(entry = {}) {
  return {
    date: typeof entry.date === 'string' ? entry.date : '',
    type: typeof entry.type === 'string' ? entry.type : 'note',
    description: typeof entry.description === 'string' ? entry.description : ''
  };
}

export function normalizeJob(rawJob = {}, index = 0) {
  const location = normalizeLocation(rawJob.location);

  const priority = VALID_PRIORITIES.has(rawJob.priority) ? rawJob.priority : 'medium';
  const status = VALID_STATUSES.has(rawJob.status) ? rawJob.status : 'interested';
  const availability = VALID_AVAILABILITIES.has(rawJob.availability) ? rawJob.availability : 'unknown';

  return {
    id: typeof rawJob.id === 'string' ? rawJob.id : `job-${index + 1}`,
    company: typeof rawJob.company === 'string' ? rawJob.company : 'Unknown company',
    position: typeof rawJob.position === 'string' ? rawJob.position : 'Unknown position',
    location,
    priority,
    status,
    availability,
    applicationType: typeof rawJob.applicationType === 'string' ? rawJob.applicationType : null,
    jobUrl: typeof rawJob.jobUrl === 'string' ? rawJob.jobUrl : null,
    companyUrl: typeof rawJob.companyUrl === 'string' ? rawJob.companyUrl : null,
    applicationDate: isValidDate(rawJob.applicationDate) ? rawJob.applicationDate : null,
    lastUpdate: isValidDate(rawJob.lastUpdate) ? rawJob.lastUpdate : null,
    documents: toArray(rawJob.documents).map(normalizeDocument),
    contacts: toArray(rawJob.contacts).map(normalizeContact),
    timeline: toArray(rawJob.timeline).map(normalizeTimelineEntry),
    notes: typeof rawJob.notes === 'string' ? rawJob.notes : '',
    tags: toArray(rawJob.tags).filter((tag) => typeof tag === 'string'),
    isDemo: Boolean(rawJob.isDemo)
  };
}

export function validateJob(job) {
  const issues = [];

  if (!job.id) issues.push('Missing id');
  if (!job.company) issues.push('Missing company');
  if (!job.position) issues.push('Missing position');
  if (!VALID_PRIORITIES.has(job.priority)) issues.push(`Invalid priority: ${job.priority}`);
  if (!VALID_STATUSES.has(job.status)) issues.push(`Invalid status: ${job.status}`);
  if (!VALID_AVAILABILITIES.has(job.availability)) issues.push(`Invalid availability: ${job.availability}`);
  if (!job.lastUpdate) issues.push('Missing or invalid lastUpdate date');

  return issues;
}

export async function loadJobs() {
  const response = await fetch('data/jobs.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load jobs.json (${response.status})`);
  }

  const raw = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error('jobs.json must contain an array of jobs');
  }

  return raw.map((item, index) => normalizeJob(item, index));
}

export function formatLocation(location) {
  const parts = [location?.city, location?.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}
