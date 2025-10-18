/**
 * @fileoverview Mock Payment Gateway Library
 * This file contains types and functions for handling payment operations
 * in the Creative Chain marketplace.
 */

import { supabase } from './supabase/client.js';

/**
 * @typedef {Object} License
 * @property {string} id - Unique identifier for the license
 * @property {string} work_id - ID of the creative work being licensed
 * @property {string} buyer_id - ID of the user purchasing the license
 * @property {string} license_type - Type of license (e.g., 'standard', 'extended')
 * @property {number} price_usdt - License price in USDT
 * @property {string} transaction_hash - Transaction hash from the payment system
 * @property {string} purchased_at - ISO timestamp when the license was purchased
 */

/**
 * @typedef {Object} PaymentSession
 * @property {string} orderId - Unique identifier for the payment session
 * @property {string} paymentUrl - URL to redirect user for payment completion
 */

/**
 * @typedef {Object} WebhookResponse
 * @property {boolean} success - Whether the webhook was processed successfully
 * @property {string} orderId - Payment session ID that was processed
 * @property {string} [licenseId] - ID of the created license (if successful)
 */

/**
 * Creates a new payment session for a license offering
 * 
 * @param {string} workId - The ID of the creative work to license
 * @param {number} priceUsdt - The price in USDT
 * @returns {Promise<PaymentSession>} Promise resolving to payment session details
 * 
 * @example
 * const session = await createPaymentSession('work_123', 25.50);
 * console.log(`Payment session created: ${session.orderId}`);
 * // Redirect user to session.paymentUrl
 */
export async function createPaymentSession(workId, priceUsdt) {
  try {
    // Generate unique payment session ID (no database interaction needed for mock)
    const orderId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate mock payment URL
    const paymentUrl = `/payment-demo/process/${orderId}`;

    console.log(`Created payment session ${orderId} for work ${workId} at ${priceUsdt} USDT`);

    return {
      orderId,
      paymentUrl
    };
  } catch (error) {
    console.error('Error in createPaymentSession:', error);
    throw error;
  }
}

/**
 * Handles incoming payment webhook notifications and creates license records
 * 
 * @param {Object} supabaseClient - Supabase client instance (can be admin client for webhooks)
 * @param {Object} payload - The webhook payload from the payment provider
 * @param {string} payload.order_id - Payment session ID from the notification
 * @param {string} payload.status - Payment status from the provider
 * @param {string} payload.work_id - ID of the creative work being licensed
 * @param {string} payload.buyer_id - ID of the user purchasing the license
 * @param {string} payload.license_type - Type of license being purchased
 * @param {number} payload.price_usdt - License price in USDT
 * @returns {Promise<WebhookResponse>} Promise resolving to webhook processing result
 * 
 * @example
 * const supabaseAdmin = createClient(url, serviceRoleKey);
 * const result = await handlePaymentWebhook(supabaseAdmin, {
 *   order_id: 'payment_123',
 *   status: 'success',
 *   work_id: 'work_456',
 *   buyer_id: 'user_789',
 *   license_type: 'standard',
 *   price_usdt: 25.50
 * });
 */
export async function handlePaymentWebhook(supabaseClient, payload) {
  try {
    const { 
      order_id: orderId, 
      status, 
      work_id: workId, 
      buyer_id: buyerId, 
      license_type: licenseType, 
      price_usdt: priceUsdt 
    } = payload;
    
    // Validate required fields
    if (!orderId) {
      return {
        success: false,
        orderId: null,
        error: 'Order ID not provided in webhook payload'
      };
    }

    if (!workId || !buyerId || !licenseType || !priceUsdt) {
      return {
        success: false,
        orderId,
        error: 'Missing required license data: work_id, buyer_id, license_type, or price_usdt'
      };
    }

    // Verify payment was successful
    const isPaymentSuccessful = status === 'success' || status === 'paid';
    
    if (!isPaymentSuccessful) {
      return {
        success: false,
        orderId,
        error: 'Payment was not successful'
      };
    }

    // Create license record in the licenses table (let database generate UUID automatically)
    const { data: newLicense, error: insertError } = await supabaseClient
      .from('licenses')
      .insert({
        work_id: workId,
        buyer_id: buyerId,
        license_type: licenseType,
        price_usdt: priceUsdt,
        transaction_hash: orderId,
        purchased_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating license record:', insertError);
      return {
        success: false,
        orderId,
        error: `Failed to create license: ${insertError.message}`
      };
    }

    console.log(`License ${newLicense.id} created successfully for payment ${orderId}`);

    return {
      success: true,
      orderId,
      licenseId: newLicense.id
    };
  } catch (error) {
    console.error('Error in handlePaymentWebhook:', error);
    return {
      success: false,
      orderId: payload.order_id || null,
      error: error.message
    };
  }
}

/**
 * Retrieves a license record by license ID
 * 
 * @param {Object} supabaseClient - Supabase client instance (use default client for regular operations)
 * @param {string} licenseId - The license ID to retrieve
 * @returns {Promise<License>} Promise resolving to the license object
 * 
 * @example
 * const license = await getLicense(supabase, 'license_123');
 * console.log(`License for work: ${license.work_id}`);
 */
export async function getLicense(supabaseClient, licenseId) {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const { data: license, error } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (error) {
      console.error('Error fetching license:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error('License not found');
      }
      
      throw new Error(`Failed to fetch license: ${error.message}`);
    }

    return license;
  } catch (error) {
    console.error('Error in getLicense:', error);
    throw error;
  }
}