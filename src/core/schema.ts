/**
 * JSON Schema (draft-07) for the ReportkitJs report format v1.0.0.
 *
 * Used by `validate.ts` (ajv) and can be published for editor tooling
 * (e.g. VS Code, JSON editors with schema support).
 */
export const reportSchema: Record<string, unknown> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://reportkitjs.dev/schema.json',
  title: 'ReportkitJs Report',
  type: 'object',
  required: ['version', 'meta', 'dataSources', 'blocks'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    meta: {
      type: 'object',
      required: ['id', 'title', 'createdAt', 'updatedAt'],
      additionalProperties: false,
      properties: {
        id: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        author: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
    theme: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primaryColor: { type: 'string' },
        fontFamily: { type: 'string' },
        maxWidth: { type: 'number', minimum: 320 },
        colors: {
          type: 'object',
          additionalProperties: false,
          properties: {
            background: { type: 'string' },
            surface: { type: 'string' },
            text: { type: 'string' },
            textMuted: { type: 'string' },
            border: { type: 'string' },
            chart: { type: 'array', items: { type: 'string' }, minItems: 1 },
          },
        },
      },
    },
    dataSources: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['id', 'name', 'type', 'data'],
            additionalProperties: false,
            properties: {
              id: { type: 'string', minLength: 1 },
              name: { type: 'string', minLength: 1 },
              type: { const: 'embedded' },
              data: {
                type: 'array',
                items: { type: 'object' },
              },
            },
          },
          {
            type: 'object',
            required: ['id', 'name', 'type', 'url'],
            additionalProperties: false,
            properties: {
              id: { type: 'string', minLength: 1 },
              name: { type: 'string', minLength: 1 },
              type: { const: 'external' },
              url: { type: 'string', minLength: 1 },
              method: { enum: ['GET', 'POST'] },
              headers: { type: 'object', additionalProperties: { type: 'string' } },
              dataPath: { type: 'string' },
              refreshInterval: { type: 'number', minimum: 1000 },
            },
          },
        ],
      },
    },
    blocks: {
      type: 'array',
      items: { $ref: '#/definitions/block' },
    },
  },
  definitions: {
    block: {
      oneOf: [
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'header' },
            props: {
              type: 'object',
              required: ['text', 'level'],
              additionalProperties: false,
              properties: {
                text: { type: 'string' },
                level: { enum: [1, 2, 3] },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'text' },
            props: {
              type: 'object',
              required: ['content'],
              additionalProperties: false,
              properties: {
                content: { type: 'string' },
                markdown: { type: 'boolean' },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'kpi' },
            props: {
              type: 'object',
              required: ['title', 'value'],
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                value: {
                  oneOf: [
                    { type: 'number' },
                    {
                      type: 'object',
                      required: ['dataSourceId', 'field', 'aggregation'],
                      additionalProperties: false,
                      properties: {
                        dataSourceId: { type: 'string' },
                        field: { type: 'string' },
                        aggregation: {
                          enum: ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'],
                        },
                      },
                    },
                  ],
                },
                format: { enum: ['number', 'currency', 'percent', 'compact'] },
                currency: { type: 'string' },
                trend: {
                  type: 'object',
                  required: ['value', 'direction'],
                  additionalProperties: false,
                  properties: {
                    value: { type: 'number' },
                    direction: { enum: ['up', 'down', 'flat'] },
                  },
                },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'table' },
            props: {
              type: 'object',
              required: ['dataSourceId', 'columns'],
              additionalProperties: false,
              properties: {
                dataSourceId: { type: 'string' },
                columns: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['field', 'label'],
                    additionalProperties: false,
                    properties: {
                      field: { type: 'string' },
                      label: { type: 'string' },
                      format: { enum: ['number', 'currency', 'percent', 'compact'] },
                      currency: { type: 'string' },
                      align: { enum: ['left', 'center', 'right'] },
                    },
                  },
                },
                title: { type: 'string' },
                pagination: {
                  type: 'object',
                  required: ['pageSize'],
                  additionalProperties: false,
                  properties: {
                    pageSize: { type: 'number', minimum: 1 },
                  },
                },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'chart' },
            props: {
              type: 'object',
              required: ['chartType', 'dataSourceId', 'xField', 'series'],
              additionalProperties: false,
              properties: {
                chartType: { enum: ['line', 'bar', 'pie'] },
                dataSourceId: { type: 'string' },
                xField: { type: 'string' },
                series: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['field'],
                    additionalProperties: false,
                    properties: {
                      field: { type: 'string' },
                      label: { type: 'string' },
                    },
                  },
                },
                title: { type: 'string' },
                showLegend: { type: 'boolean' },
                showGrid: { type: 'boolean' },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'divider' },
            props: {
              type: 'object',
              required: ['style'],
              additionalProperties: false,
              properties: {
                style: { enum: ['solid', 'dashed', 'dotted'] },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'image' },
            props: {
              type: 'object',
              required: ['src'],
              additionalProperties: false,
              properties: {
                src: { type: 'string', minLength: 1 },
                alt: { type: 'string' },
                caption: { type: 'string' },
                maxWidth: { type: 'number', minimum: 1 },
              },
            },
          },
        },
        {
          type: 'object',
          required: ['id', 'type', 'props'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1 },
            type: { const: 'section' },
            props: {
              type: 'object',
              required: ['blocks'],
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                blocks: {
                  type: 'array',
                  items: { $ref: '#/definitions/block' },
                },
              },
            },
          },
        },
      ],
    },
  },
};
