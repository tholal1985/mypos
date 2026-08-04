/*
# FASEYHA POS - Additional Modules Schema

## Overview
Adds database tables for all missing modules from the original system:
E-commerce, Field Force, HMS (Hospital Management), Cheque, Superadmin (SaaS),
ZATCA (Saudi e-invoicing), Inbox Report, Custom Dashboard, Connector (API integrations),
WooCommerce sync, AI Assistance, Product Catalogue, Spreadsheet import/export.

## New Tables
1. ecommerce_orders - Online store orders
2. ecommerce_order_items - Line items for online orders
3. field_agents - Field force agents
4. field_visits - Agent visits/check-ins
5. field_tasks - Tasks assigned to field agents
6. hms_patients - Hospital patients
7. hms_appointments - Patient appointments
8. hms_medical_records - Medical records
9. hms_billing - Hospital billing
10. cheques - Received and issued cheques
11. saas_plans - Subscription plans (superadmin)
12. saas_subscriptions - Business subscriptions
13. zatca_invoices - Saudi e-invoice records
14. inbox_reports - Report inbox/notifications
15. custom_dashboards - Custom dashboard configurations
16. dashboard_widgets - Widgets within custom dashboards
17. api_connectors - API integration configurations
18. woocommerce_settings - WooCommerce sync settings
19. ai_conversations - AI chat conversations
20. ai_messages - Messages within AI conversations
21. product_catalogues - Product catalogue configurations
22. import_exports - Spreadsheet import/export jobs

## Security
- RLS enabled on all tables
- Business-scoped policies using is_business_member()
- 4 policies per table
*/

-- ============================================================
-- E-COMMERCE
-- ============================================================

CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_address text,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12,4) NOT NULL DEFAULT 0,
  shipping_cost numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,4) NOT NULL DEFAULT 0,
  order_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ecommerce_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  unit_price numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIELD FORCE
-- ============================================================

CREATE TABLE IF NOT EXISTS field_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  territory text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE field_agents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS field_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES field_agents(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL DEFAULT now(),
  location text,
  notes text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS field_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES field_agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE field_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HMS (Hospital Management)
-- ============================================================

CREATE TABLE IF NOT EXISTS hms_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  gender text,
  date_of_birth date,
  address text,
  blood_group text,
  emergency_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE hms_patients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS hms_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
  doctor_name text,
  appointment_date timestamptz NOT NULL DEFAULT now(),
  reason text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE hms_appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS hms_medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
  diagnosis text,
  prescription text,
  notes text,
  record_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hms_medical_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS hms_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  amount numeric(12,4) NOT NULL DEFAULT 0,
  paid_amount numeric(12,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  billing_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE hms_billing ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CHEQUE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS cheques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  cheque_number text NOT NULL,
  bank_name text,
  type text NOT NULL DEFAULT 'received',
  payee text,
  amount numeric(12,4) NOT NULL DEFAULT 0,
  issue_date date,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUPERADMIN (SaaS Management)
-- ============================================================

CREATE TABLE IF NOT EXISTS saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,4) NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_users int NOT NULL DEFAULT 5,
  max_products int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES saas_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ZATCA (Saudi E-Invoicing)
-- ============================================================

CREATE TABLE IF NOT EXISTS zatca_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  uuid text,
  qr_code text,
  status text NOT NULL DEFAULT 'pending',
  zatca_response jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE zatca_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INBOX REPORT
-- ============================================================

CREATE TABLE IF NOT EXISTS inbox_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'notification',
  message text,
  is_read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inbox_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CUSTOM DASHBOARD
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  widget_type text NOT NULL,
  title text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position_x int NOT NULL DEFAULT 0,
  position_y int NOT NULL DEFAULT 0,
  width int NOT NULL DEFAULT 1,
  height int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONNECTOR (API Integrations)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL,
  api_url text,
  auth_type text NOT NULL DEFAULT 'api_key',
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'inactive',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE api_connectors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WOOCOMMERCE SYNC
-- ============================================================

CREATE TABLE IF NOT EXISTS woocommerce_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  store_url text NOT NULL,
  consumer_key text,
  consumer_secret text,
  auto_sync boolean NOT NULL DEFAULT false,
  sync_interval int NOT NULL DEFAULT 60,
  last_sync_at timestamptz,
  status text NOT NULL DEFAULT 'disconnected',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE woocommerce_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AI ASSISTANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRODUCT CATALOGUE
-- ============================================================

CREATE TABLE IF NOT EXISTS product_catalogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE product_catalogues ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SPREADSHEET (Import/Export)
-- ============================================================

CREATE TABLE IF NOT EXISTS import_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'import',
  module text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending',
  total_rows int NOT NULL DEFAULT 0,
  processed_rows int NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE import_exports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_business ON ecommerce_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_field_agents_business ON field_agents(business_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_business ON field_visits(business_id);
CREATE INDEX IF NOT EXISTS idx_hms_patients_business ON hms_patients(business_id);
CREATE INDEX IF NOT EXISTS idx_hms_appointments_business ON hms_appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_cheques_business ON cheques(business_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_business ON saas_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_zatca_invoices_business ON zatca_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_inbox_reports_business ON inbox_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_business ON custom_dashboards(business_id);
CREATE INDEX IF NOT EXISTS idx_api_connectors_business ON api_connectors(business_id);
CREATE INDEX IF NOT EXISTS idx_woocommerce_settings_business ON woocommerce_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_business ON ai_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_product_catalogues_business ON product_catalogues(business_id);
CREATE INDEX IF NOT EXISTS idx_import_exports_business ON import_exports(business_id);

-- ============================================================
-- RLS POLICIES (business-scoped tables)
-- ============================================================

-- E-commerce orders
DROP POLICY IF EXISTS "select_ecommerce_orders" ON ecommerce_orders;
CREATE POLICY "select_ecommerce_orders" ON ecommerce_orders FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_ecommerce_orders" ON ecommerce_orders;
CREATE POLICY "insert_ecommerce_orders" ON ecommerce_orders FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_ecommerce_orders" ON ecommerce_orders;
CREATE POLICY "update_ecommerce_orders" ON ecommerce_orders FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_ecommerce_orders" ON ecommerce_orders;
CREATE POLICY "delete_ecommerce_orders" ON ecommerce_orders FOR DELETE TO authenticated USING (is_business_member(business_id));

-- E-commerce order items
DROP POLICY IF EXISTS "select_ecommerce_order_items" ON ecommerce_order_items;
CREATE POLICY "select_ecommerce_order_items" ON ecommerce_order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM ecommerce_orders WHERE ecommerce_orders.id = ecommerce_order_items.order_id AND is_business_member(ecommerce_orders.business_id)));
DROP POLICY IF EXISTS "insert_ecommerce_order_items" ON ecommerce_order_items;
CREATE POLICY "insert_ecommerce_order_items" ON ecommerce_order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM ecommerce_orders WHERE ecommerce_orders.id = ecommerce_order_items.order_id AND is_business_member(ecommerce_orders.business_id)));
DROP POLICY IF EXISTS "update_ecommerce_order_items" ON ecommerce_order_items;
CREATE POLICY "update_ecommerce_order_items" ON ecommerce_order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM ecommerce_orders WHERE ecommerce_orders.id = ecommerce_order_items.order_id AND is_business_member(ecommerce_orders.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM ecommerce_orders WHERE ecommerce_orders.id = ecommerce_order_items.order_id AND is_business_member(ecommerce_orders.business_id)));
DROP POLICY IF EXISTS "delete_ecommerce_order_items" ON ecommerce_order_items;
CREATE POLICY "delete_ecommerce_order_items" ON ecommerce_order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM ecommerce_orders WHERE ecommerce_orders.id = ecommerce_order_items.order_id AND is_business_member(ecommerce_orders.business_id)));

-- Field agents
DROP POLICY IF EXISTS "select_field_agents" ON field_agents;
CREATE POLICY "select_field_agents" ON field_agents FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_field_agents" ON field_agents;
CREATE POLICY "insert_field_agents" ON field_agents FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_field_agents" ON field_agents;
CREATE POLICY "update_field_agents" ON field_agents FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_field_agents" ON field_agents;
CREATE POLICY "delete_field_agents" ON field_agents FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Field visits
DROP POLICY IF EXISTS "select_field_visits" ON field_visits;
CREATE POLICY "select_field_visits" ON field_visits FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_field_visits" ON field_visits;
CREATE POLICY "insert_field_visits" ON field_visits FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_field_visits" ON field_visits;
CREATE POLICY "update_field_visits" ON field_visits FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_field_visits" ON field_visits;
CREATE POLICY "delete_field_visits" ON field_visits FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Field tasks
DROP POLICY IF EXISTS "select_field_tasks" ON field_tasks;
CREATE POLICY "select_field_tasks" ON field_tasks FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_field_tasks" ON field_tasks;
CREATE POLICY "insert_field_tasks" ON field_tasks FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_field_tasks" ON field_tasks;
CREATE POLICY "update_field_tasks" ON field_tasks FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_field_tasks" ON field_tasks;
CREATE POLICY "delete_field_tasks" ON field_tasks FOR DELETE TO authenticated USING (is_business_member(business_id));

-- HMS patients
DROP POLICY IF EXISTS "select_hms_patients" ON hms_patients;
CREATE POLICY "select_hms_patients" ON hms_patients FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_hms_patients" ON hms_patients;
CREATE POLICY "insert_hms_patients" ON hms_patients FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_hms_patients" ON hms_patients;
CREATE POLICY "update_hms_patients" ON hms_patients FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_hms_patients" ON hms_patients;
CREATE POLICY "delete_hms_patients" ON hms_patients FOR DELETE TO authenticated USING (is_business_member(business_id));

-- HMS appointments
DROP POLICY IF EXISTS "select_hms_appointments" ON hms_appointments;
CREATE POLICY "select_hms_appointments" ON hms_appointments FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_hms_appointments" ON hms_appointments;
CREATE POLICY "insert_hms_appointments" ON hms_appointments FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_hms_appointments" ON hms_appointments;
CREATE POLICY "update_hms_appointments" ON hms_appointments FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_hms_appointments" ON hms_appointments;
CREATE POLICY "delete_hms_appointments" ON hms_appointments FOR DELETE TO authenticated USING (is_business_member(business_id));

-- HMS medical records
DROP POLICY IF EXISTS "select_hms_medical_records" ON hms_medical_records;
CREATE POLICY "select_hms_medical_records" ON hms_medical_records FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_hms_medical_records" ON hms_medical_records;
CREATE POLICY "insert_hms_medical_records" ON hms_medical_records FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_hms_medical_records" ON hms_medical_records;
CREATE POLICY "update_hms_medical_records" ON hms_medical_records FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_hms_medical_records" ON hms_medical_records;
CREATE POLICY "delete_hms_medical_records" ON hms_medical_records FOR DELETE TO authenticated USING (is_business_member(business_id));

-- HMS billing
DROP POLICY IF EXISTS "select_hms_billing" ON hms_billing;
CREATE POLICY "select_hms_billing" ON hms_billing FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_hms_billing" ON hms_billing;
CREATE POLICY "insert_hms_billing" ON hms_billing FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_hms_billing" ON hms_billing;
CREATE POLICY "update_hms_billing" ON hms_billing FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_hms_billing" ON hms_billing;
CREATE POLICY "delete_hms_billing" ON hms_billing FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Cheques
DROP POLICY IF EXISTS "select_cheques" ON cheques;
CREATE POLICY "select_cheques" ON cheques FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_cheques" ON cheques;
CREATE POLICY "insert_cheques" ON cheques FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_cheques" ON cheques;
CREATE POLICY "update_cheques" ON cheques FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_cheques" ON cheques;
CREATE POLICY "delete_cheques" ON cheques FOR DELETE TO authenticated USING (is_business_member(business_id));

-- SaaS plans (readable by all authenticated, writable by all)
DROP POLICY IF EXISTS "select_saas_plans" ON saas_plans;
CREATE POLICY "select_saas_plans" ON saas_plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_saas_plans" ON saas_plans;
CREATE POLICY "insert_saas_plans" ON saas_plans FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_saas_plans" ON saas_plans;
CREATE POLICY "update_saas_plans" ON saas_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_saas_plans" ON saas_plans;
CREATE POLICY "delete_saas_plans" ON saas_plans FOR DELETE TO authenticated USING (true);

-- SaaS subscriptions
DROP POLICY IF EXISTS "select_saas_subscriptions" ON saas_subscriptions;
CREATE POLICY "select_saas_subscriptions" ON saas_subscriptions FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_saas_subscriptions" ON saas_subscriptions;
CREATE POLICY "insert_saas_subscriptions" ON saas_subscriptions FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_saas_subscriptions" ON saas_subscriptions;
CREATE POLICY "update_saas_subscriptions" ON saas_subscriptions FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_saas_subscriptions" ON saas_subscriptions;
CREATE POLICY "delete_saas_subscriptions" ON saas_subscriptions FOR DELETE TO authenticated USING (is_business_member(business_id));

-- ZATCA invoices
DROP POLICY IF EXISTS "select_zatca_invoices" ON zatca_invoices;
CREATE POLICY "select_zatca_invoices" ON zatca_invoices FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_zatca_invoices" ON zatca_invoices;
CREATE POLICY "insert_zatca_invoices" ON zatca_invoices FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_zatca_invoices" ON zatca_invoices;
CREATE POLICY "update_zatca_invoices" ON zatca_invoices FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_zatca_invoices" ON zatca_invoices;
CREATE POLICY "delete_zatca_invoices" ON zatca_invoices FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Inbox reports
DROP POLICY IF EXISTS "select_inbox_reports" ON inbox_reports;
CREATE POLICY "select_inbox_reports" ON inbox_reports FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_inbox_reports" ON inbox_reports;
CREATE POLICY "insert_inbox_reports" ON inbox_reports FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_inbox_reports" ON inbox_reports;
CREATE POLICY "update_inbox_reports" ON inbox_reports FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_inbox_reports" ON inbox_reports;
CREATE POLICY "delete_inbox_reports" ON inbox_reports FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Custom dashboards
DROP POLICY IF EXISTS "select_custom_dashboards" ON custom_dashboards;
CREATE POLICY "select_custom_dashboards" ON custom_dashboards FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_custom_dashboards" ON custom_dashboards;
CREATE POLICY "insert_custom_dashboards" ON custom_dashboards FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_custom_dashboards" ON custom_dashboards;
CREATE POLICY "update_custom_dashboards" ON custom_dashboards FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_custom_dashboards" ON custom_dashboards;
CREATE POLICY "delete_custom_dashboards" ON custom_dashboards FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Dashboard widgets
DROP POLICY IF EXISTS "select_dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "select_dashboard_widgets" ON dashboard_widgets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM custom_dashboards WHERE custom_dashboards.id = dashboard_widgets.dashboard_id AND is_business_member(custom_dashboards.business_id)));
DROP POLICY IF EXISTS "insert_dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "insert_dashboard_widgets" ON dashboard_widgets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM custom_dashboards WHERE custom_dashboards.id = dashboard_widgets.dashboard_id AND is_business_member(custom_dashboards.business_id)));
DROP POLICY IF EXISTS "update_dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "update_dashboard_widgets" ON dashboard_widgets FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM custom_dashboards WHERE custom_dashboards.id = dashboard_widgets.dashboard_id AND is_business_member(custom_dashboards.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM custom_dashboards WHERE custom_dashboards.id = dashboard_widgets.dashboard_id AND is_business_member(custom_dashboards.business_id)));
DROP POLICY IF EXISTS "delete_dashboard_widgets" ON dashboard_widgets;
CREATE POLICY "delete_dashboard_widgets" ON dashboard_widgets FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM custom_dashboards WHERE custom_dashboards.id = dashboard_widgets.dashboard_id AND is_business_member(custom_dashboards.business_id)));

-- API connectors
DROP POLICY IF EXISTS "select_api_connectors" ON api_connectors;
CREATE POLICY "select_api_connectors" ON api_connectors FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_api_connectors" ON api_connectors;
CREATE POLICY "insert_api_connectors" ON api_connectors FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_api_connectors" ON api_connectors;
CREATE POLICY "update_api_connectors" ON api_connectors FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_api_connectors" ON api_connectors;
CREATE POLICY "delete_api_connectors" ON api_connectors FOR DELETE TO authenticated USING (is_business_member(business_id));

-- WooCommerce settings
DROP POLICY IF EXISTS "select_woocommerce_settings" ON woocommerce_settings;
CREATE POLICY "select_woocommerce_settings" ON woocommerce_settings FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_woocommerce_settings" ON woocommerce_settings;
CREATE POLICY "insert_woocommerce_settings" ON woocommerce_settings FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_woocommerce_settings" ON woocommerce_settings;
CREATE POLICY "update_woocommerce_settings" ON woocommerce_settings FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_woocommerce_settings" ON woocommerce_settings;
CREATE POLICY "delete_woocommerce_settings" ON woocommerce_settings FOR DELETE TO authenticated USING (is_business_member(business_id));

-- AI conversations
DROP POLICY IF EXISTS "select_ai_conversations" ON ai_conversations;
CREATE POLICY "select_ai_conversations" ON ai_conversations FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_ai_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_ai_conversations" ON ai_conversations;
CREATE POLICY "update_ai_conversations" ON ai_conversations FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_ai_conversations" ON ai_conversations FOR DELETE TO authenticated USING (is_business_member(business_id));

-- AI messages
DROP POLICY IF EXISTS "select_ai_messages" ON ai_messages;
CREATE POLICY "select_ai_messages" ON ai_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND is_business_member(ai_conversations.business_id)));
DROP POLICY IF EXISTS "insert_ai_messages" ON ai_messages;
CREATE POLICY "insert_ai_messages" ON ai_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND is_business_member(ai_conversations.business_id)));
DROP POLICY IF EXISTS "update_ai_messages" ON ai_messages;
CREATE POLICY "update_ai_messages" ON ai_messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND is_business_member(ai_conversations.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND is_business_member(ai_conversations.business_id)));
DROP POLICY IF EXISTS "delete_ai_messages" ON ai_messages;
CREATE POLICY "delete_ai_messages" ON ai_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND is_business_member(ai_conversations.business_id)));

-- Product catalogues
DROP POLICY IF EXISTS "select_product_catalogues" ON product_catalogues;
CREATE POLICY "select_product_catalogues" ON product_catalogues FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_product_catalogues" ON product_catalogues;
CREATE POLICY "insert_product_catalogues" ON product_catalogues FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_product_catalogues" ON product_catalogues;
CREATE POLICY "update_product_catalogues" ON product_catalogues FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_product_catalogues" ON product_catalogues;
CREATE POLICY "delete_product_catalogues" ON product_catalogues FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Import/exports
DROP POLICY IF EXISTS "select_import_exports" ON import_exports;
CREATE POLICY "select_import_exports" ON import_exports FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_import_exports" ON import_exports;
CREATE POLICY "insert_import_exports" ON import_exports FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_import_exports" ON import_exports;
CREATE POLICY "update_import_exports" ON import_exports FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_import_exports" ON import_exports;
CREATE POLICY "delete_import_exports" ON import_exports FOR DELETE TO authenticated USING (is_business_member(business_id));

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER for new tables
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END;
$$;
