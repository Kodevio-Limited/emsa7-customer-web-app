import { type MenuItem, type OptionGroup, MOCK_MENU_ITEMS } from '@/types/menu';

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'https://validity-include-essence-intention.trycloudflare.com';
};

export const menuApi = {
  getMenu: async (branchId?: string): Promise<{ items: MenuItem[]; categories: { id: string; name: string; nameAr: string }[] }> => {
    try {
      const baseUrl = getApiBaseUrl();
      const targetBranch = branchId || 'branch-1';
      const res = await fetch(`${baseUrl}/api/v1/customer/menu/?branch_id=${targetBranch}`);
      if (!res.ok) throw new Error('Failed to fetch from backend');
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error(json.message || 'Invalid format');

      const categories: { id: string; name: string; nameAr: string }[] = [];
      const items: MenuItem[] = [];

      for (const cat of json.data) {
        categories.push({ id: cat.id, name: cat.name, nameAr: cat.name_ar || cat.name });
        for (const it of cat.items || []) {
          const optionGroups: OptionGroup[] = (it.modifier_groups || []).map((mg: any) => ({
            id: mg.id,
            title: mg.name,
            titleAr: mg.name_ar,
            required: mg.is_required,
            type: mg.max_selections === 1 ? 'single' : 'multiple',
            options: (mg.options || []).map((opt: any) => ({
              id: opt.id,
              name: opt.name,
              nameAr: opt.name_ar,
              price: opt.price_extra || 0,
            })),
          }));

          items.push({
            id: it.id,
            name: it.name,
            nameAr: it.name_ar,
            description: it.description || '',
            descriptionAr: it.description_ar || '',
            price: it.base_price,
            category: cat.name.toLowerCase().includes('drink') ? 'drinks' : cat.name.toLowerCase().includes('dessert') ? 'desserts' : 'main',
            imageUrl: it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
            isPopular: true,
            optionGroups,
          });
        }
      }

      if (items.length > 0) {
        return { items, categories };
      }
      return { items: MOCK_MENU_ITEMS, categories: [] };
    } catch (err) {
      console.warn('Backend unavailable, falling back to cached mock menu:', err);
      return { items: MOCK_MENU_ITEMS, categories: [] };
    }
  },

  createOrder: async (data: { tableId?: string; items: any[]; specialInstructions?: string }) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/customer/orders/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error('Order creation error:', err);
      return { success: false, message: 'Could not connect to backend' };
    }
  },

  payDemo: async (orderId: string, paymentMethod: string = 'CARD', tipAmount: number = 0) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/customer/orders/${orderId}/pay-demo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: paymentMethod, tip_amount: tipAmount }),
      });
      return await res.json();
    } catch (err) {
      console.error('Payment error:', err);
      return { success: false, message: 'Payment network error' };
    }
  },

  callWaiter: async (tableId: string, reason: string = 'Assistance requested') => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/customer/table/call-waiter/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId, reason }),
      });
      return await res.json();
    } catch (err) {
      console.error('Call waiter error:', err);
      return { success: false, message: 'Network error calling waiter' };
    }
  },
};
