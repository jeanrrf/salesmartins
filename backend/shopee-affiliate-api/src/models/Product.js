// Certifique-se de que seu modelo de produto inclua todos estes campos
const productSchema = new Schema({
  shop_id: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  commission_rate: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  image_url: { type: String },
  shop_name: { type: String },
  offer_link: { type: String },
  short_link: { type: String },
  rating_star: { type: Number, default: 0 },
  price_discount_rate: { type: Number, default: 0 },
  sub_ids: { type: String }, // JSON string
  created_at: { type: Date },
  updated_at: { type: Date },
  product_link: { type: String, default: "" },
  shop_type: { type: String, default: "" },
  affiliate_link: { type: String },
  product_metadata: { type: String, default: "{}" }, // JSON string
  discount: { type: String, default: "" },
  category_name: { type: String }
});
