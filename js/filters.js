const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
};

function matchesFilter(value, selectedFilter) {
  if (!selectedFilter || selectedFilter === 'all') {
    return true;
  }
  return value === selectedFilter;
}

function includesText(value, searchTerm) {
  if (!searchTerm) {
    return true;
  }
  return value.toLowerCase().includes(searchTerm);
}

export function filterJobs(jobs, criteria) {
  const searchTerm = (criteria.search || '').trim().toLowerCase();

  return jobs.filter((job) => {
    const searchable = [
      job.company,
      job.position,
      job.location?.city,
      job.location?.country,
      ...(job.tags || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const tagMatch = criteria.tag === 'all' || !criteria.tag
      ? true
      : (job.tags || []).includes(criteria.tag);

    return (
      includesText(searchable, searchTerm) &&
      matchesFilter(job.status, criteria.status) &&
      matchesFilter(job.priority, criteria.priority) &&
      matchesFilter(job.availability, criteria.availability) &&
      matchesFilter(job.company, criteria.company) &&
      matchesFilter(`${job.location?.city || ''}, ${job.location?.country || ''}`.trim(), criteria.location) &&
      tagMatch
    );
  });
}

function compareDates(a, b) {
  const aDate = a ? Date.parse(a) : 0;
  const bDate = b ? Date.parse(b) : 0;
  return aDate - bDate;
}

function compareStrings(a, b) {
  return (a || '').localeCompare(b || '');
}

export function sortJobs(jobs, sortKey) {
  const [field, direction] = sortKey.split('_');

  const sorted = [...jobs].sort((left, right) => {
    switch (field) {
      case 'priority':
        return (PRIORITY_ORDER[left.priority] ?? 99) - (PRIORITY_ORDER[right.priority] ?? 99);
      case 'company':
        return compareStrings(left.company, right.company);
      case 'lastUpdate':
      default:
        return compareDates(left.lastUpdate, right.lastUpdate);
    }
  });

  return direction === 'desc' ? sorted.reverse() : sorted;
}
