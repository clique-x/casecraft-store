/** States and union territories, as used on Indian shipping labels. */
export const INDIAN_STATES: readonly string[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/**
 * City and state for a pincode from India Post's public lookup. Best effort: any failure
 * (offline, slow, unknown pincode) returns null and the visitor types them instead.
 */
export async function lookupPincode(pin: string, signal?: AbortSignal): Promise<{ city: string; state: string } | null> {
  if (!/^[1-9]\d{5}$/.test(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string }[] | null }[];
    const office = body[0]?.Status === 'Success' ? body[0].PostOffice?.[0] : undefined;
    if (!office?.District || !office.State) return null;
    const state = INDIAN_STATES.find((s) => s.toLowerCase() === office.State!.toLowerCase()) ?? office.State;
    return { city: office.District, state };
  } catch {
    return null;
  }
}
