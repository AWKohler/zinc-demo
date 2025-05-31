export async function zincFetch<T = unknown>(
  url: string,
  opts: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<T> {
  const { body, ...restOpts } = opts;
  
  const config: RequestInit = {
    ...restOpts,
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.ZINC_CLIENT_TOKEN + ':').toString('base64')}`,
      'Content-Type': 'application/json',
      ...restOpts.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`https://api.zinc.io${url}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Zinc API error: ${response.status} ${response.statusText}`, {
      cause: errorData
    });
  }

  return response.json();
}

export interface ZincOrder {
  idempotency_key: string;
  retailer: "amazon";
  products: Array<{
    product_id: string;
    quantity: number;
  }>;
  max_price: number;
  shipping_method: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  webhooks: {
    request_succeeded: string;
    request_failed: string;
    tracking_obtained: string;
    tracking_updated: string;
  };
  retailer_credentials?: {
    email: string;
    password: string;
    totp_2fa_key?: string;
    verification_code?: string;
  };
  payment_method?: {
    name_on_card: string;
    number: string;
    security_code: string;
    expiration_month: number;
    expiration_year: number;
    use_gift: boolean;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  addax?: boolean;
}

export interface ZincOrderResponse {
  _type: string;
  request_id: string;
  merchant_order_id?: string;
  tracking?: Array<{
    product_id: string;
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  }>;
  price_components?: {
    shipping: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  delivery_date?: string;
  code?: string;
  message?: string;
}

export interface ZincReturnRequest {
  merchant_order_id: string;
  products: Array<{
    product_id: string;
    quantity: number;
    reason_code: string;
  }>;
  method_code: string;
}

export interface ZincReturnResponse {
  _type: string;
  request_id: string;
  return_label_url?: string;
  status?: string;
  code?: string;
  message?: string;
}