/*
# FASEYHA POS - Core Schema

## Overview
This migration creates the complete core schema for a multi-user POS (Point of Sale) system.
It supports businesses, users with roles, products with variations, categories, brands, units,
sales with line items, customers, suppliers, purchases, expenses, and accounting.

## New Tables
1. businesses - Root entity for each business/tenant
2. business_users - Links users to businesses with roles
3. categories - Product categories (nested)
4. brands - Product brands
5. units - Measurement units
6. tax_rates - Tax rates
7. variation_value_templates - Reusable variation templates
8. variation_values - Values within templates
9. customers - Customer records
10. suppliers - Supplier records
11. products - Main product table
12. product_variations - Variations for variable products
13. sales - Each sale/transaction
14. sale_lines - Line items within a sale
15. sale_payments - Payments against a sale
16. purchases - Stock purchase orders
17. purchase_lines - Line items within a purchase
18. expenses - Business expenses
19. accounts - Financial accounts
20. transactions - Money movement
21. crm_leads - CRM leads
22. crm_follow_ups - Follow-up activities
23. repair_jobs - Repair tracking
24. manufacturing_orders - Production orders
25. manufacturing_ingredients - Raw materials for production
26. projects - Business projects
27. project_tasks - Tasks within projects
28. assets - Business assets
29. gym_members - Gym members
30. cms_pages - Content pages

## Security
- RLS enabled on ALL tables
- Policies scope data by business membership via business_users
- auth.uid() used for ownership checks
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE), scoped to authenticated

## Notes
- Multi-tenant, multi-user app with sign-in required
- All tables have business_id FK for data isolation
*/

-- ============================================================
-- BUSINESS & USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  tax_label text NOT NULL DEFAULT 'Tax',
  default_tax_rate numeric(10,4) NOT NULL DEFAULT 0,
  logo_url text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS business_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRODUCT MANAGEMENT (no FK to customers/suppliers)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text NOT NULL,
  base_unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  conversion_factor numeric(10,4) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS variation_value_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE variation_value_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS variation_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES variation_value_templates(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE variation_values ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CUSTOMERS & SUPPLIERS (before sales/purchases)
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text,
  opening_balance numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text,
  opening_balance numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRODUCTS (after categories, brands, units, tax_rates)
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  barcode text,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  tax_rate_id uuid REFERENCES tax_rates(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'single',
  image_url text,
  price numeric(12,4) NOT NULL DEFAULT 0,
  cost numeric(12,4) NOT NULL DEFAULT 0,
  stock numeric(12,4) NOT NULL DEFAULT 0,
  alert_quantity numeric(12,4) NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric(12,4) NOT NULL DEFAULT 0,
  cost numeric(12,4) NOT NULL DEFAULT 0,
  stock numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SALES / POS (after customers, products)
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  payment_status text NOT NULL DEFAULT 'paid',
  subtotal numeric(12,4) NOT NULL DEFAULT 0,
  tax_total numeric(12,4) NOT NULL DEFAULT 0,
  discount_total numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,4) NOT NULL DEFAULT 0,
  paid_amount numeric(12,4) NOT NULL DEFAULT 0,
  change_return numeric(12,4) NOT NULL DEFAULT 0,
  sale_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sale_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variation_id uuid REFERENCES product_variations(id) ON DELETE SET NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  unit_price numeric(12,4) NOT NULL DEFAULT 0,
  unit_cost numeric(12,4) NOT NULL DEFAULT 0,
  tax_rate numeric(10,4) NOT NULL DEFAULT 0,
  tax_amount numeric(12,4) NOT NULL DEFAULT 0,
  discount_amount numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount numeric(12,4) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  reference text,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PURCHASES / STOCK-IN (after suppliers, products)
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  reference_number text,
  status text NOT NULL DEFAULT 'received',
  total numeric(12,4) NOT NULL DEFAULT 0,
  paid_amount numeric(12,4) NOT NULL DEFAULT 0,
  purchase_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS purchase_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variation_id uuid REFERENCES product_variations(id) ON DELETE SET NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  unit_cost numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE purchase_lines ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  description text,
  amount numeric(12,4) NOT NULL DEFAULT 0,
  expense_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACCOUNTING
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'cash',
  balance numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'credit',
  amount numeric(12,4) NOT NULL DEFAULT 0,
  description text,
  reference_type text,
  reference_id uuid,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CRM
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crm_follow_ups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REPAIR
-- ============================================================

CREATE TABLE IF NOT EXISTS repair_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  serial_number text,
  issue text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  charge numeric(12,4) NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE repair_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MANUFACTURING
-- ============================================================

CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS manufacturing_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE manufacturing_ingredients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROJECT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  start_date date,
  end_date date,
  budget numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ASSET MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  serial_number text,
  purchase_date date,
  purchase_value numeric(12,4) NOT NULL DEFAULT 0,
  current_value numeric(12,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_use',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GYM MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  membership_type text NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CMS
-- ============================================================

CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sale_lines_sale ON sale_lines(sale_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_accounts_business ON accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);

-- ============================================================
-- RLS HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_business_member(check_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = check_business_id
    AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Businesses
DROP POLICY IF EXISTS "select_own_businesses" ON businesses;
CREATE POLICY "select_own_businesses" ON businesses FOR SELECT TO authenticated USING (is_business_member(id));
DROP POLICY IF EXISTS "insert_own_businesses" ON businesses;
CREATE POLICY "insert_own_businesses" ON businesses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_businesses" ON businesses;
CREATE POLICY "update_own_businesses" ON businesses FOR UPDATE TO authenticated USING (is_business_member(id)) WITH CHECK (is_business_member(id));
DROP POLICY IF EXISTS "delete_own_businesses" ON businesses;
CREATE POLICY "delete_own_businesses" ON businesses FOR DELETE TO authenticated USING (is_business_member(id));

-- Business users
DROP POLICY IF EXISTS "select_business_users" ON business_users;
CREATE POLICY "select_business_users" ON business_users FOR SELECT TO authenticated USING (is_business_member(business_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS "insert_business_users" ON business_users;
CREATE POLICY "insert_business_users" ON business_users FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS "update_business_users" ON business_users;
CREATE POLICY "update_business_users" ON business_users FOR UPDATE TO authenticated USING (is_business_member(business_id) OR user_id = auth.uid()) WITH CHECK (is_business_member(business_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS "delete_business_users" ON business_users;
CREATE POLICY "delete_business_users" ON business_users FOR DELETE TO authenticated USING (is_business_member(business_id) OR user_id = auth.uid());

-- Categories
DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_categories" ON categories;
CREATE POLICY "update_categories" ON categories FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_categories" ON categories;
CREATE POLICY "delete_categories" ON categories FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Brands
DROP POLICY IF EXISTS "select_brands" ON brands;
CREATE POLICY "select_brands" ON brands FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_brands" ON brands;
CREATE POLICY "insert_brands" ON brands FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_brands" ON brands;
CREATE POLICY "update_brands" ON brands FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_brands" ON brands;
CREATE POLICY "delete_brands" ON brands FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Units
DROP POLICY IF EXISTS "select_units" ON units;
CREATE POLICY "select_units" ON units FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_units" ON units;
CREATE POLICY "insert_units" ON units FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_units" ON units;
CREATE POLICY "update_units" ON units FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_units" ON units;
CREATE POLICY "delete_units" ON units FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Tax rates
DROP POLICY IF EXISTS "select_tax_rates" ON tax_rates;
CREATE POLICY "select_tax_rates" ON tax_rates FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_tax_rates" ON tax_rates;
CREATE POLICY "insert_tax_rates" ON tax_rates FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_tax_rates" ON tax_rates;
CREATE POLICY "update_tax_rates" ON tax_rates FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_tax_rates" ON tax_rates;
CREATE POLICY "delete_tax_rates" ON tax_rates FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Products
DROP POLICY IF EXISTS "select_products" ON products;
CREATE POLICY "select_products" ON products FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_products" ON products;
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Product variations
DROP POLICY IF EXISTS "select_product_variations" ON product_variations;
CREATE POLICY "select_product_variations" ON product_variations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variations.product_id AND is_business_member(products.business_id)));
DROP POLICY IF EXISTS "insert_product_variations" ON product_variations;
CREATE POLICY "insert_product_variations" ON product_variations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_variations.product_id AND is_business_member(products.business_id)));
DROP POLICY IF EXISTS "update_product_variations" ON product_variations;
CREATE POLICY "update_product_variations" ON product_variations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variations.product_id AND is_business_member(products.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_variations.product_id AND is_business_member(products.business_id)));
DROP POLICY IF EXISTS "delete_product_variations" ON product_variations;
CREATE POLICY "delete_product_variations" ON product_variations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variations.product_id AND is_business_member(products.business_id)));

-- Variation templates
DROP POLICY IF EXISTS "select_variation_templates" ON variation_value_templates;
CREATE POLICY "select_variation_templates" ON variation_value_templates FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_variation_templates" ON variation_value_templates;
CREATE POLICY "insert_variation_templates" ON variation_value_templates FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_variation_templates" ON variation_value_templates;
CREATE POLICY "update_variation_templates" ON variation_value_templates FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_variation_templates" ON variation_value_templates;
CREATE POLICY "delete_variation_templates" ON variation_value_templates FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Variation values
DROP POLICY IF EXISTS "select_variation_values" ON variation_values;
CREATE POLICY "select_variation_values" ON variation_values FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM variation_value_templates WHERE variation_value_templates.id = variation_values.template_id AND is_business_member(variation_value_templates.business_id)));
DROP POLICY IF EXISTS "insert_variation_values" ON variation_values;
CREATE POLICY "insert_variation_values" ON variation_values FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM variation_value_templates WHERE variation_value_templates.id = variation_values.template_id AND is_business_member(variation_value_templates.business_id)));
DROP POLICY IF EXISTS "update_variation_values" ON variation_values;
CREATE POLICY "update_variation_values" ON variation_values FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM variation_value_templates WHERE variation_value_templates.id = variation_values.template_id AND is_business_member(variation_value_templates.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM variation_value_templates WHERE variation_value_templates.id = variation_values.template_id AND is_business_member(variation_value_templates.business_id)));
DROP POLICY IF EXISTS "delete_variation_values" ON variation_values;
CREATE POLICY "delete_variation_values" ON variation_values FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM variation_value_templates WHERE variation_value_templates.id = variation_values.template_id AND is_business_member(variation_value_templates.business_id)));

-- Customers
DROP POLICY IF EXISTS "select_customers" ON customers;
CREATE POLICY "select_customers" ON customers FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_customers" ON customers;
CREATE POLICY "insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_customers" ON customers;
CREATE POLICY "update_customers" ON customers FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_customers" ON customers;
CREATE POLICY "delete_customers" ON customers FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Suppliers
DROP POLICY IF EXISTS "select_suppliers" ON suppliers;
CREATE POLICY "select_suppliers" ON suppliers FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_suppliers" ON suppliers;
CREATE POLICY "insert_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_suppliers" ON suppliers;
CREATE POLICY "update_suppliers" ON suppliers FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_suppliers" ON suppliers;
CREATE POLICY "delete_suppliers" ON suppliers FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Sales
DROP POLICY IF EXISTS "select_sales" ON sales;
CREATE POLICY "select_sales" ON sales FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_sales" ON sales;
CREATE POLICY "insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_sales" ON sales;
CREATE POLICY "update_sales" ON sales FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_sales" ON sales;
CREATE POLICY "delete_sales" ON sales FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Sale lines
DROP POLICY IF EXISTS "select_sale_lines" ON sale_lines;
CREATE POLICY "select_sale_lines" ON sale_lines FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_lines.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "insert_sale_lines" ON sale_lines;
CREATE POLICY "insert_sale_lines" ON sale_lines FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_lines.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "update_sale_lines" ON sale_lines;
CREATE POLICY "update_sale_lines" ON sale_lines FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_lines.sale_id AND is_business_member(sales.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_lines.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "delete_sale_lines" ON sale_lines;
CREATE POLICY "delete_sale_lines" ON sale_lines FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_lines.sale_id AND is_business_member(sales.business_id)));

-- Sale payments
DROP POLICY IF EXISTS "select_sale_payments" ON sale_payments;
CREATE POLICY "select_sale_payments" ON sale_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "insert_sale_payments" ON sale_payments;
CREATE POLICY "insert_sale_payments" ON sale_payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "update_sale_payments" ON sale_payments;
CREATE POLICY "update_sale_payments" ON sale_payments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND is_business_member(sales.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND is_business_member(sales.business_id)));
DROP POLICY IF EXISTS "delete_sale_payments" ON sale_payments;
CREATE POLICY "delete_sale_payments" ON sale_payments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND is_business_member(sales.business_id)));

-- Purchases
DROP POLICY IF EXISTS "select_purchases" ON purchases;
CREATE POLICY "select_purchases" ON purchases FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_purchases" ON purchases;
CREATE POLICY "insert_purchases" ON purchases FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_purchases" ON purchases;
CREATE POLICY "update_purchases" ON purchases FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_purchases" ON purchases;
CREATE POLICY "delete_purchases" ON purchases FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Purchase lines
DROP POLICY IF EXISTS "select_purchase_lines" ON purchase_lines;
CREATE POLICY "select_purchase_lines" ON purchase_lines FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_lines.purchase_id AND is_business_member(purchases.business_id)));
DROP POLICY IF EXISTS "insert_purchase_lines" ON purchase_lines;
CREATE POLICY "insert_purchase_lines" ON purchase_lines FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_lines.purchase_id AND is_business_member(purchases.business_id)));
DROP POLICY IF EXISTS "update_purchase_lines" ON purchase_lines;
CREATE POLICY "update_purchase_lines" ON purchase_lines FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_lines.purchase_id AND is_business_member(purchases.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_lines.purchase_id AND is_business_member(purchases.business_id)));
DROP POLICY IF EXISTS "delete_purchase_lines" ON purchase_lines;
CREATE POLICY "delete_purchase_lines" ON purchase_lines FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_lines.purchase_id AND is_business_member(purchases.business_id)));

-- Expenses
DROP POLICY IF EXISTS "select_expenses" ON expenses;
CREATE POLICY "select_expenses" ON expenses FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_expenses" ON expenses;
CREATE POLICY "insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_expenses" ON expenses;
CREATE POLICY "update_expenses" ON expenses FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_expenses" ON expenses;
CREATE POLICY "delete_expenses" ON expenses FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Accounts
DROP POLICY IF EXISTS "select_accounts" ON accounts;
CREATE POLICY "select_accounts" ON accounts FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_accounts" ON accounts;
CREATE POLICY "insert_accounts" ON accounts FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_accounts" ON accounts;
CREATE POLICY "update_accounts" ON accounts FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_accounts" ON accounts;
CREATE POLICY "delete_accounts" ON accounts FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Transactions
DROP POLICY IF EXISTS "select_transactions" ON transactions;
CREATE POLICY "select_transactions" ON transactions FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_transactions" ON transactions;
CREATE POLICY "insert_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_transactions" ON transactions;
CREATE POLICY "update_transactions" ON transactions FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_transactions" ON transactions;
CREATE POLICY "delete_transactions" ON transactions FOR DELETE TO authenticated USING (is_business_member(business_id));

-- CRM leads
DROP POLICY IF EXISTS "select_crm_leads" ON crm_leads;
CREATE POLICY "select_crm_leads" ON crm_leads FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_crm_leads" ON crm_leads;
CREATE POLICY "insert_crm_leads" ON crm_leads FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_crm_leads" ON crm_leads;
CREATE POLICY "update_crm_leads" ON crm_leads FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_crm_leads" ON crm_leads;
CREATE POLICY "delete_crm_leads" ON crm_leads FOR DELETE TO authenticated USING (is_business_member(business_id));

-- CRM follow-ups
DROP POLICY IF EXISTS "select_crm_follow_ups" ON crm_follow_ups;
CREATE POLICY "select_crm_follow_ups" ON crm_follow_ups FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_follow_ups.lead_id AND is_business_member(crm_leads.business_id)));
DROP POLICY IF EXISTS "insert_crm_follow_ups" ON crm_follow_ups;
CREATE POLICY "insert_crm_follow_ups" ON crm_follow_ups FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_follow_ups.lead_id AND is_business_member(crm_leads.business_id)));
DROP POLICY IF EXISTS "update_crm_follow_ups" ON crm_follow_ups;
CREATE POLICY "update_crm_follow_ups" ON crm_follow_ups FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_follow_ups.lead_id AND is_business_member(crm_leads.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_follow_ups.lead_id AND is_business_member(crm_leads.business_id)));
DROP POLICY IF EXISTS "delete_crm_follow_ups" ON crm_follow_ups;
CREATE POLICY "delete_crm_follow_ups" ON crm_follow_ups FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_follow_ups.lead_id AND is_business_member(crm_leads.business_id)));

-- Repair jobs
DROP POLICY IF EXISTS "select_repair_jobs" ON repair_jobs;
CREATE POLICY "select_repair_jobs" ON repair_jobs FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_repair_jobs" ON repair_jobs;
CREATE POLICY "insert_repair_jobs" ON repair_jobs FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_repair_jobs" ON repair_jobs;
CREATE POLICY "update_repair_jobs" ON repair_jobs FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_repair_jobs" ON repair_jobs;
CREATE POLICY "delete_repair_jobs" ON repair_jobs FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Manufacturing orders
DROP POLICY IF EXISTS "select_manufacturing_orders" ON manufacturing_orders;
CREATE POLICY "select_manufacturing_orders" ON manufacturing_orders FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_manufacturing_orders" ON manufacturing_orders;
CREATE POLICY "insert_manufacturing_orders" ON manufacturing_orders FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_manufacturing_orders" ON manufacturing_orders;
CREATE POLICY "update_manufacturing_orders" ON manufacturing_orders FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_manufacturing_orders" ON manufacturing_orders;
CREATE POLICY "delete_manufacturing_orders" ON manufacturing_orders FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Manufacturing ingredients
DROP POLICY IF EXISTS "select_manufacturing_ingredients" ON manufacturing_ingredients;
CREATE POLICY "select_manufacturing_ingredients" ON manufacturing_ingredients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM manufacturing_orders WHERE manufacturing_orders.id = manufacturing_ingredients.order_id AND is_business_member(manufacturing_orders.business_id)));
DROP POLICY IF EXISTS "insert_manufacturing_ingredients" ON manufacturing_ingredients;
CREATE POLICY "insert_manufacturing_ingredients" ON manufacturing_ingredients FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM manufacturing_orders WHERE manufacturing_orders.id = manufacturing_ingredients.order_id AND is_business_member(manufacturing_orders.business_id)));
DROP POLICY IF EXISTS "update_manufacturing_ingredients" ON manufacturing_ingredients;
CREATE POLICY "update_manufacturing_ingredients" ON manufacturing_ingredients FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM manufacturing_orders WHERE manufacturing_orders.id = manufacturing_ingredients.order_id AND is_business_member(manufacturing_orders.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM manufacturing_orders WHERE manufacturing_orders.id = manufacturing_ingredients.order_id AND is_business_member(manufacturing_orders.business_id)));
DROP POLICY IF EXISTS "delete_manufacturing_ingredients" ON manufacturing_ingredients;
CREATE POLICY "delete_manufacturing_ingredients" ON manufacturing_ingredients FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM manufacturing_orders WHERE manufacturing_orders.id = manufacturing_ingredients.order_id AND is_business_member(manufacturing_orders.business_id)));

-- Projects
DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_projects" ON projects;
CREATE POLICY "insert_projects" ON projects FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_projects" ON projects;
CREATE POLICY "update_projects" ON projects FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_projects" ON projects;
CREATE POLICY "delete_projects" ON projects FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Project tasks
DROP POLICY IF EXISTS "select_project_tasks" ON project_tasks;
CREATE POLICY "select_project_tasks" ON project_tasks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND is_business_member(projects.business_id)));
DROP POLICY IF EXISTS "insert_project_tasks" ON project_tasks;
CREATE POLICY "insert_project_tasks" ON project_tasks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND is_business_member(projects.business_id)));
DROP POLICY IF EXISTS "update_project_tasks" ON project_tasks;
CREATE POLICY "update_project_tasks" ON project_tasks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND is_business_member(projects.business_id))) WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND is_business_member(projects.business_id)));
DROP POLICY IF EXISTS "delete_project_tasks" ON project_tasks;
CREATE POLICY "delete_project_tasks" ON project_tasks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND is_business_member(projects.business_id)));

-- Assets
DROP POLICY IF EXISTS "select_assets" ON assets;
CREATE POLICY "select_assets" ON assets FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_assets" ON assets;
CREATE POLICY "insert_assets" ON assets FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_assets" ON assets;
CREATE POLICY "update_assets" ON assets FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_assets" ON assets;
CREATE POLICY "delete_assets" ON assets FOR DELETE TO authenticated USING (is_business_member(business_id));

-- Gym members
DROP POLICY IF EXISTS "select_gym_members" ON gym_members;
CREATE POLICY "select_gym_members" ON gym_members FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_gym_members" ON gym_members;
CREATE POLICY "insert_gym_members" ON gym_members FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_gym_members" ON gym_members;
CREATE POLICY "update_gym_members" ON gym_members FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_gym_members" ON gym_members;
CREATE POLICY "delete_gym_members" ON gym_members FOR DELETE TO authenticated USING (is_business_member(business_id));

-- CMS pages
DROP POLICY IF EXISTS "select_cms_pages" ON cms_pages;
CREATE POLICY "select_cms_pages" ON cms_pages FOR SELECT TO authenticated USING (is_business_member(business_id));
DROP POLICY IF EXISTS "insert_cms_pages" ON cms_pages;
CREATE POLICY "insert_cms_pages" ON cms_pages FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "update_cms_pages" ON cms_pages;
CREATE POLICY "update_cms_pages" ON cms_pages FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));
DROP POLICY IF EXISTS "delete_cms_pages" ON cms_pages;
CREATE POLICY "delete_cms_pages" ON cms_pages FOR DELETE TO authenticated USING (is_business_member(business_id));

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
