const crudRouter = require('./crud');

const common = { sort_order: { type: 'int' }, published: { type: 'bool' } };

module.exports = {
  projects: crudRouter({
    table: 'projects', resource: 'projects',
    fields: {
      slug: { type: 'string', required: true, max: 80 },
      name: { type: 'string', required: true, max: 160 },
      category: { type: 'string', max: 80 },
      filter_tags: { type: 'array' },
      icon: { type: 'string', max: 40 },
      description: { type: 'string' },
      tech: { type: 'array' },
      github_url: { type: 'string' },
      live_url: { type: 'string' },
      detail: { type: 'json' },
      ...common,
    },
  }),
  skills: crudRouter({
    table: 'skills', resource: 'skills', orderBy: 'sort_order ASC, id ASC',
    fields: {
      category: { type: 'string', required: true, max: 60 },
      category_icon: { type: 'string', max: 40 },
      name: { type: 'string', required: true, max: 80 },
      description: { type: 'string' },
      level: { type: 'int' },
      ...common,
    },
  }),
  experiences: crudRouter({
    table: 'experiences', resource: 'experiences',
    fields: {
      role: { type: 'string', required: true, max: 160 },
      company: { type: 'string', required: true, max: 160 },
      duration: { type: 'string', max: 80 },
      description: { type: 'string' },
      highlights: { type: 'json' },
      ...common,
    },
  }),
  certifications: crudRouter({
    table: 'certifications', resource: 'certifications',
    fields: {
      name: { type: 'string', required: true, max: 160 },
      provider: { type: 'string', max: 120 },
      year: { type: 'string', max: 10 },
      icon: { type: 'string', max: 40 },
      ...common,
    },
  }),
};
