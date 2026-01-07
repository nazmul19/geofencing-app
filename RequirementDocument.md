Requirement Document
Multi-Tenant Geofencing Based Surveillance and Tracking System
1. Overview

The system will leverage geofencing to enable surveillance, monitoring, and tracking use cases based on device movement and location. It will be designed as a multi-tenant SaaS platform, allowing multiple organizations to operate independently within a single system while being governed by a centralized Super User.

The platform will support defining geofenced regions, associating them with operational flows such as routes or orders, and assigning these flows to users for monitoring and compliance tracking.

2. Technology Stack

Backend: Node.js with NestJS

ORM: TypeORM

Database: PostgreSQL (multi-tenant architecture)

Authentication: Email-based signup

Security: CAPTCHA on public signup

Deployment: Cloud-ready, scalable architecture

3. Multi-Tenancy Model

Each Organization represents a tenant.

Data must be logically isolated per organization.

A Super User governs organization lifecycle management.

4. User Roles
4.1 Super User

Approves or rejects new organization setup requests.

Activates or deactivates organizations.

Has visibility across all organizations but does not participate in daily operations.

4.2 Organization Admin

Manages users within their organization.

Creates and manages geofencing regions.

Creates and assigns routes to users.

Can only operate if the organization is in an Active state.

4.3 End User

Belongs to a specific organization.

Can be assigned one or more routes.

Participates in tracking and monitoring workflows.

5. Organization Onboarding Flow

End user signs up using an email-based signup form.

Signup form includes CAPTCHA validation.

Signup creates a pending organization request.

Super User reviews and approves the organization.

Once approved, the organization becomes active.

Organization Admin can now onboard additional users.

6. Functional Requirements
6.1 Signup and Authentication

Public signup form with:

Email

Password

Organization details

CAPTCHA

Signup does not immediately activate the organization.

Login allowed only after organization approval.

6.2 Organization Management

Organization status:

Pending

Active

Inactive

Only Active organizations can perform operations.

Organization Admin can:

Add, invite, or remove users.

Assign roles within the organization.

7. Core Domain Entities
7.1 Geofence (Region)

A Geofence represents a circular geographic region.

Attributes:

Name (meaningful and human-readable, e.g., “Warehouse Zone A”)

Center Latitude

Center Longitude

Radius (in meters)

Organization ID

Created By

Status (Active / Inactive)

This entity defines the basic unit for monitoring location-based events.

7.2 Route (Flow)

A Route represents a logical sequence of geofences associated with operational tracking, such as deliveries, patrols, or inspections.

Attributes:

Name (e.g., “Morning Delivery Route”)

Organization ID

List of associated Geofences (ordered)

Expected Date and Time (per geofence or overall route)

Allowed Relaxation Time (grace period in minutes)

Status (Planned / Active / Completed)

Notes:

A Route can be associated with one or more orders or tracking tasks.

Relaxation time allows tolerance around expected arrival times.

7.3 Route Assignment

A Route can be assigned to one or more users.

A user can have multiple routes.

Assignment includes:

Assigned User ID

Assignment Date

Status

8. Use Cases

Monitor whether a user enters or exits a geofenced region.

Track compliance with expected route timings.

Detect delays beyond allowed relaxation minutes.

Enable surveillance and monitoring workflows across devices.

9. Non-Functional Requirements

Scalable multi-tenant architecture.

Secure access control based on roles.

High availability and fault tolerance.

Auditable actions for organization approval and route assignments.

10. Future Extensions (Optional)

Real-time alerts and notifications.

Device-level tracking integration.

Reporting and analytics dashboard.

Webhook or API integration with external systems.

11. Organization Identification and Domain Mapping
11.1 Email Domain as Organization Identifier

The email domain of the signup user (for example, @company.com) will be used as the primary unique identifier for an Organization.

Each Organization will have one unique email domain.

Multiple organizations cannot share the same email domain.

11.2 Signup Flow with Email Domain Validation

End user signs up using an official email address.

System extracts the email domain from the user’s email.

If the domain does not exist:

A new Organization request is created with:

Organization Domain

Organization Name (optional or derived)

Status = Pending

If the domain already exists:

User is mapped to the existing organization.

User activation depends on organization status.

CAPTCHA validation is mandatory during signup.

Super User reviews and approves the organization request.

Once approved, the organization becomes Active.

11.3 Organization Domain Rules

Organization domain must be:

Unique across the system

Verified during signup

Public email domains (e.g., gmail.com, yahoo.com) can be:

Either blocked, or

Allowed only for demo or trial organizations (configurable)

Domain change after approval requires Super User intervention.

11.4 Database Enhancements

Organization Entity (Updated Fields):

id

name

emailDomain (unique, indexed)

status (Pending, Active, Inactive)

createdAt

approvedAt

approvedBy

User Entity (Relevant Fields):

id

email

organizationId

role

status

11.5 Access Control Based on Domain

User signup is allowed only if:

Email domain matches an approved organization, or

A new organization request is successfully created.

Login access is allowed only when:

Organization status is Active

User status is Active

11.6 Benefits of Domain-Based Organization Mapping

Eliminates manual organization selection during signup.

Prevents cross-organization data leakage.

Simplifies user onboarding and tenant isolation.

Enforces corporate identity and access boundaries.
