export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcement_banners: {
        Row: {
          bg_color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          link_url: string | null
          store_id: string
          text: string
          text_color: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          store_id: string
          text: string
          text_color?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          store_id?: string
          text?: string
          text_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invitations: {
        Row: {
          canonical_email: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          status: string
          token_hash: string
        }
        Insert: {
          canonical_email: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          status?: string
          token_hash: string
        }
        Update: {
          canonical_email?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          status?: string
          token_hash?: string
        }
        Relationships: []
      }
      carriers: {
        Row: {
          average_delivery_days: string
          created_at: string
          id: string
          name: string
          phone: string
          seller_reference_rate: number
          supported_payment_modes: string[]
          whatsapp: string
        }
        Insert: {
          average_delivery_days?: string
          created_at?: string
          id?: string
          name: string
          phone: string
          seller_reference_rate?: number
          supported_payment_modes?: string[]
          whatsapp: string
        }
        Update: {
          average_delivery_days?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          seller_reference_rate?: number
          supported_payment_modes?: string[]
          whatsapp?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          accepted_currencies: string[]
          capital: string
          code: string
          created_at: string
          default_dial_code: string
          flag_emoji: string
          name: string
          official_currency: string
          region: string
        }
        Insert: {
          accepted_currencies?: string[]
          capital: string
          code: string
          created_at?: string
          default_dial_code: string
          flag_emoji: string
          name: string
          official_currency: string
          region: string
        }
        Update: {
          accepted_currencies?: string[]
          capital?: string
          code?: string
          created_at?: string
          default_dial_code?: string
          flag_emoji?: string
          name?: string
          official_currency?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_official_currency_fkey"
            columns: ["official_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      country_teams: {
        Row: {
          country_code: string
          created_at: string
          id: string
          role: string
          shop_id: string
          user_id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          role: string
          shop_id: string
          user_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          role?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_teams_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "country_teams_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          cma_pegged: boolean
          code: string
          created_at: string
          decimals: number
          is_african: boolean
          name: string
          smallest_unit_name: string
          symbol: string
        }
        Insert: {
          cma_pegged?: boolean
          code: string
          created_at?: string
          decimals: number
          is_african?: boolean
          name: string
          smallest_unit_name: string
          symbol: string
        }
        Update: {
          cma_pegged?: boolean
          code?: string
          created_at?: string
          decimals?: number
          is_african?: boolean
          name?: string
          smallest_unit_name?: string
          symbol?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      invitation_quotas: {
        Row: {
          created_at: string
          id: string
          invites_used: number
          total_invites_allowed: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invites_used?: number
          total_invites_allowed?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invites_used?: number
          total_invites_allowed?: number
          user_id?: string
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          shop_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_accounts: {
        Row: {
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          password_hash: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_verified?: boolean
          password_hash: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          password_hash?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_pixels: {
        Row: {
          apply_to_all_products: boolean
          capi_token: string | null
          created_at: string
          id: string
          is_active: boolean
          is_capi_enabled: boolean
          name: string
          pixel_id: string
          specific_product_ids: string[] | null
          store_id: string | null
          target_event: string
          test_event_code: string | null
          updated_at: string
        }
        Insert: {
          apply_to_all_products?: boolean
          capi_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_capi_enabled?: boolean
          name: string
          pixel_id: string
          specific_product_ids?: string[] | null
          store_id?: string | null
          target_event?: string
          test_event_code?: string | null
          updated_at?: string
        }
        Update: {
          apply_to_all_products?: boolean
          capi_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_capi_enabled?: boolean
          name?: string
          pixel_id?: string
          specific_product_ids?: string[] | null
          store_id?: string | null
          target_event?: string
          test_event_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_pixels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_financials: {
        Row: {
          ad_spend: number
          cost_price: number
          created_at: string
          id: string
          net_profit: number
          order_id: string
          shipping_cost: number
          store_id: string
        }
        Insert: {
          ad_spend?: number
          cost_price?: number
          created_at?: string
          id?: string
          net_profit?: number
          order_id: string
          shipping_cost?: number
          store_id: string
        }
        Update: {
          ad_spend?: number
          cost_price?: number
          created_at?: string
          id?: string
          net_profit?: number
          order_id?: string
          shipping_cost?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_financials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_financials_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          image: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variant_name: string | null
        }
        Insert: {
          id?: string
          image?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_name?: string | null
        }
        Update: {
          id?: string
          image?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_closer_id: string | null
          assigned_rider_id: string | null
          city: string
          country: string
          created_at: string
          currency: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_agency_id: string | null
          id: string
          notes: string | null
          order_number: string
          scheduled_date: string | null
          shipping_fee: number
          status: string
          status_reason: string | null
          store_id: string | null
          subtotal: number
          total_amount: number
          updated_at: string
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_closer_id?: string | null
          assigned_rider_id?: string | null
          city: string
          country: string
          created_at?: string
          currency: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_agency_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          scheduled_date?: string | null
          shipping_fee?: number
          status?: string
          status_reason?: string | null
          store_id?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_closer_id?: string | null
          assigned_rider_id?: string | null
          city?: string
          country?: string
          created_at?: string
          currency?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_agency_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          scheduled_date?: string | null
          shipping_fee?: number
          status?: string
          status_reason?: string | null
          store_id?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_country_fkey"
            columns: ["country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orders_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          id: string
          is_published: boolean | null
          page_type: string | null
          seo_meta: Json | null
          slug: string
          storefront_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          page_type?: string | null
          seo_meta?: Json | null
          slug: string
          storefront_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          page_type?: string | null
          seo_meta?: Json | null
          slug?: string
          storefront_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          provider: string
          provider_name: string
          shop_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          provider: string
          provider_name: string
          shop_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          provider?: string
          provider_name?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          order_id: string
          order_number: string
          payment_method: string
          rejection_reason: string | null
          screenshot_url: string | null
          sender_name: string
          sender_phone: string
          shop_id: string
          status: string
          transaction_reference: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          id?: string
          order_id: string
          order_number: string
          payment_method: string
          rejection_reason?: string | null
          screenshot_url?: string | null
          sender_name: string
          sender_phone: string
          shop_id: string
          status?: string
          transaction_reference: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          order_number?: string
          payment_method?: string
          rejection_reason?: string | null
          screenshot_url?: string | null
          sender_name?: string
          sender_phone?: string
          shop_id?: string
          status?: string
          transaction_reference?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "payment_proofs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          address: string
          carrier_id: string
          city: string
          created_at: string
          id: string
          name: string
          opening_hours: string
          phone: string
        }
        Insert: {
          address: string
          carrier_id: string
          city: string
          created_at?: string
          id?: string
          name: string
          opening_hours: string
          phone: string
        }
        Update: {
          address?: string
          carrier_id?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          opening_hours?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_points_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          collection: string | null
          compare_at_price: number | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          name: string
          product_status: string | null
          quantity_offers: Json | null
          sale_price: number
          sku: string | null
          slug: string
          stock: number
          stock_status: string | null
          store_id: string | null
          updated_at: string
          variants: Json | null
        }
        Insert: {
          category?: string | null
          collection?: string | null
          compare_at_price?: number | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name: string
          product_status?: string | null
          quantity_offers?: Json | null
          sale_price?: number
          sku?: string | null
          slug: string
          stock?: number
          stock_status?: string | null
          store_id?: string | null
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          category?: string | null
          collection?: string | null
          compare_at_price?: number | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name?: string
          product_status?: string | null
          quantity_offers?: Json | null
          sale_price?: number
          sku?: string | null
          slug?: string
          stock?: number
          stock_status?: string | null
          store_id?: string | null
          updated_at?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_id: string | null
          created_at: string
          delivered_at: string | null
          dispatched_at: string | null
          id: string
          order_id: string
          pickup_point_id: string | null
          returned_at: string | null
          shop_id: string
          status: string
          waybill_number: string | null
        }
        Insert: {
          carrier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          order_id: string
          pickup_point_id?: string | null
          returned_at?: string | null
          shop_id: string
          status?: string
          waybill_number?: string | null
        }
        Update: {
          carrier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          order_id?: string
          pickup_point_id?: string | null
          returned_at?: string | null
          shop_id?: string
          status?: string
          waybill_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          carrier_id: string | null
          city_name: string
          client_delivery_fee: number
          country_code: string
          created_at: string
          default_pickup_point_id: string | null
          estimated_delivery_time: string
          id: string
          payment_mode: string
          seller_cost: number
          shop_id: string
          zone_type: string
        }
        Insert: {
          carrier_id?: string | null
          city_name: string
          client_delivery_fee?: number
          country_code: string
          created_at?: string
          default_pickup_point_id?: string | null
          estimated_delivery_time?: string
          id?: string
          payment_mode: string
          seller_cost?: number
          shop_id: string
          zone_type: string
        }
        Update: {
          carrier_id?: string | null
          city_name?: string
          client_delivery_fee?: number
          country_code?: string
          created_at?: string
          default_pickup_point_id?: string | null
          estimated_delivery_time?: string
          id?: string
          payment_mode?: string
          seller_cost?: number
          shop_id?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_zones_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shipping_zones_default_pickup_point_id_fkey"
            columns: ["default_pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_zones_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_countries: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_primary: boolean
          shop_id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          is_primary?: boolean
          shop_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_countries_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shop_countries_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          country_code: string
          created_at: string
          currency_locked: boolean
          delivery_policy: string
          id: string
          name: string
          owner_email: string | null
          primary_currency: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency_locked?: boolean
          delivery_policy?: string
          id?: string
          name: string
          owner_email?: string | null
          primary_currency: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency_locked?: boolean
          delivery_policy?: string
          id?: string
          name?: string
          owner_email?: string | null
          primary_currency?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shops_primary_currency_fkey"
            columns: ["primary_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      storefronts: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          id: string
          is_published: boolean | null
          last_draft_updated_at: string | null
          published_at: string | null
          settings: Json | null
          store_id: string
          subdomain: string
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_published?: boolean | null
          last_draft_updated_at?: string | null
          published_at?: string | null
          settings?: Json | null
          store_id: string
          subdomain: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_published?: boolean | null
          last_draft_updated_at?: string | null
          published_at?: string | null
          settings?: Json | null
          store_id?: string
          subdomain?: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefronts_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          country_code: string
          country_name: string | null
          created_at: string
          currency: string
          flag: string | null
          id: string
          logo: string | null
          name: string
          owner_email: string | null
          slug: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          country_code: string
          country_name?: string | null
          created_at?: string
          currency: string
          flag?: string | null
          id?: string
          logo?: string | null
          name: string
          owner_email?: string | null
          slug: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string | null
          created_at?: string
          currency?: string
          flag?: string | null
          id?: string
          logo?: string | null
          name?: string
          owner_email?: string | null
          slug?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stores_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          agency_id: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          invite_token: string | null
          joined_at: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          store_id: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          agency_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invite_token?: string | null
          joined_at?: string
          name: string
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          store_id: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          agency_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invite_token?: string | null
          joined_at?: string
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_country_fkey"
            columns: ["country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "team_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          colors: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          preset: string
          styles: Json
          typography: Json
          updated_at: string | null
        }
        Insert: {
          colors: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          preset: string
          styles: Json
          typography: Json
          updated_at?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          preset?: string
          styles?: Json
          typography?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      tracking_tokens: {
        Row: {
          access_count: number
          created_at: string
          expires_at: string
          id: string
          is_revoked: boolean
          last_accessed_at: string | null
          order_id: string
          store_id: string
          token_hash: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          expires_at: string
          id?: string
          is_revoked?: boolean
          last_accessed_at?: string | null
          order_id: string
          store_id: string
          token_hash: string
        }
        Update: {
          access_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_revoked?: boolean
          last_accessed_at?: string | null
          order_id?: string
          store_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_scaling_snapshots: {
        Row: {
          ad_spend_dollars: number
          closing_rate: number
          cpa_breakeven_dollars: number
          cpa_target_dollars: number
          created_at: string
          delivered_units: number
          dollar_rate: number
          end_date: string
          id: string
          is_current: boolean
          net_profit_fcfa: number
          orders_count: number
          pending_units: number
          products_summary: Json | null
          real_cpa_dollars: number
          start_date: string
          store_id: string | null
          week_key: string
          week_number: number
        }
        Insert: {
          ad_spend_dollars?: number
          closing_rate?: number
          cpa_breakeven_dollars?: number
          cpa_target_dollars?: number
          created_at?: string
          delivered_units?: number
          dollar_rate?: number
          end_date: string
          id?: string
          is_current?: boolean
          net_profit_fcfa?: number
          orders_count?: number
          pending_units?: number
          products_summary?: Json | null
          real_cpa_dollars?: number
          start_date: string
          store_id?: string | null
          week_key: string
          week_number: number
        }
        Update: {
          ad_spend_dollars?: number
          closing_rate?: number
          cpa_breakeven_dollars?: number
          cpa_target_dollars?: number
          created_at?: string
          delivered_units?: number
          dollar_rate?: number
          end_date?: string
          id?: string
          is_current?: boolean
          net_profit_fcfa?: number
          orders_count?: number
          pending_units?: number
          products_summary?: Json | null
          real_cpa_dollars?: number
          start_date?: string
          store_id?: string | null
          week_key?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_scaling_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "owner" | "admin" | "manager" | "closer" | "rider" | "agency"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["owner", "admin", "manager", "closer", "rider", "agency"],
    },
  },
} as const
