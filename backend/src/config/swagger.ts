import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Foodlobbyin API',
    version: '1.0.0',
    description: `
# Foodlobbyin B2B Market Insights Platform API

A comprehensive API for B2B companies to manage their profiles, invoices, and access market insights.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with email verification, password reset, and OTP login
- 🎫 **Referral System** - Invite-only registration with referral codes
- 🏢 **Company Management** - CRUD operations for company profiles with GSTN validation
- 📄 **Invoice Management** - Track and manage invoices
- 📊 **Market Insights** - Access aggregated, anonymized market data
- 🤖 **Bot Protection** - reCAPTCHA integration for secure registration
- ⚡ **Rate Limiting** - Protection against abuse

## Authentication

Most endpoints require authentication. Use the **Authorize** button above to set your JWT token.

1. Register or login to get a JWT token
2. Click the **Authorize** button
3. Enter: \`Bearer YOUR_JWT_TOKEN\`
4. All authenticated requests will include this token

## Rate Limits

- Auth endpoints: 5 requests per 15 minutes
- OTP endpoints: 10 requests per 15 minutes
- Create endpoints: 10 requests per minute
- General API: 100 requests per 15 minutes
    `,
    contact: {
      name: 'Foodlobbyin Support',
      email: 'support@foodlobbyin.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: '/api',
      description: 'Base API path',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer {token}',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
          },
          username: {
            type: 'string',
            description: 'Username',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address',
          },
          first_name: {
            type: 'string',
            description: 'First name',
          },
          last_name: {
            type: 'string',
            description: 'Last name',
          },
          mobile_number: {
            type: 'string',
            description: 'Mobile number in E.164 format',
            example: '+1234567890',
          },
          phone_number: {
            type: 'string',
            description: 'Phone number',
          },
          gstn: {
            type: 'string',
            description: 'GSTN (15-character format)',
            pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
            example: '27AAPFU0939F1ZV',
          },
          email_verified: {
            type: 'boolean',
            description: 'Email verification status',
          },
          account_activated: {
            type: 'boolean',
            description: 'Account activation status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Company ID',
          },
          user_id: {
            type: 'integer',
            description: 'Owner user ID',
          },
          name: {
            type: 'string',
            description: 'Company name',
          },
          industry: {
            type: 'string',
            description: 'Industry sector',
          },
          revenue: {
            type: 'number',
            format: 'decimal',
            description: 'Annual revenue',
          },
          employees: {
            type: 'integer',
            description: 'Number of employees',
          },
          address: {
            type: 'string',
            description: 'Company address',
          },
          city: {
            type: 'string',
            description: 'City',
          },
          country: {
            type: 'string',
            description: 'Country',
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'Company website URL',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Invoice ID',
          },
          company_id: {
            type: 'integer',
            description: 'Company ID',
          },
          invoice_number: {
            type: 'string',
            description: 'Invoice number',
          },
          amount: {
            type: 'number',
            format: 'decimal',
            description: 'Invoice amount',
          },
          issue_date: {
            type: 'string',
            format: 'date',
            description: 'Date invoice was issued',
          },
          due_date: {
            type: 'string',
            format: 'date',
            description: 'Payment due date',
          },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'overdue', 'cancelled'],
            description: 'Invoice status',
          },
          category: {
            type: 'string',
            description: 'Invoice category',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Referral: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Referral ID',
          },
          code: {
            type: 'string',
            description: 'Unique referral code',
            example: 'REF-ABC123XYZ',
          },
          created_by_user_id: {
            type: 'integer',
            description: 'User who created the referral',
          },
          max_uses: {
            type: 'integer',
            description: 'Maximum number of uses',
            minimum: 1,
          },
          used_count: {
            type: 'integer',
            description: 'Number of times used',
          },
          expires_at: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration date',
          },
          allowed_email_domain: {
            type: 'string',
            description: 'Restrict to specific email domain (optional)',
            example: 'company.com',
          },
          is_active: {
            type: 'boolean',
            description: 'Active status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      MarketInsights: {
        type: 'object',
        properties: {
          total_companies: {
            type: 'integer',
            description: 'Total number of companies',
          },
          average_revenue: {
            type: 'number',
            format: 'decimal',
            description: 'Average company revenue',
          },
          average_employees: {
            type: 'number',
            format: 'decimal',
            description: 'Average number of employees',
          },
          total_invoiced: {
            type: 'number',
            format: 'decimal',
            description: 'Total invoiced amount',
          },
          by_industry: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                industry: {
                  type: 'string',
                },
                count: {
                  type: 'integer',
                },
                avg_revenue: {
                  type: 'number',
                  format: 'decimal',
                },
                avg_employees: {
                  type: 'number',
                  format: 'decimal',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and account management',
    },
    {
      name: 'Secure Auth',
      description: 'Secure registration with referral system, GSTN validation, and OTP verification',
    },
    {
      name: 'Referrals',
      description: 'Referral code management and validation',
    },
    {
      name: 'Company',
      description: 'Company profile management',
    },
    {
      name: 'Invoices',
      description: 'Invoice management',
    },
    {
      name: 'Insights',
      description: 'Market insights and analytics',
    },
    {
      name: 'Health',
      description: 'API health check',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  // Path to the API routes
  apis: [
    './src/routes/*.routes.ts',
    './src/routes/*.routes.js',
    './dist/routes/*.routes.js',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api-docs',
    ...swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Foodlobbyin API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );
};

export default swaggerSpec;
