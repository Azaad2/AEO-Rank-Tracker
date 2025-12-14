-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create customers table to track email captures and payments
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  scan_id UUID REFERENCES public.scans(id),
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  pdf_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_scan_id ON public.customers(scan_id);
CREATE INDEX idx_customers_stripe_session_id ON public.customers(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public insert for email capture
CREATE POLICY "Allow public insert customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Allow public select to check unlock status
CREATE POLICY "Allow public select customers"
ON public.customers
FOR SELECT
USING (true);

-- Allow updates for payment processing
CREATE POLICY "Allow public update customers"
ON public.customers
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();