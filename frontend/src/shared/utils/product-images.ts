/**
 * Centralized product image mapping.
 * Maps product names (lowercase, normalized) to their local asset paths.
 * Reuse this across Product Catalog, Shopping Cart, Checkout, Order History, etc.
 */

import appleJuice from "../../assets/products/apple-juice.jpg";
import badamMilk from "../../assets/products/badam-milk.jpg";
import badusha from "../../assets/products/badusha.jpg";
import boondiLaddu from "../../assets/products/boondi-laddu.jpg";
import brownBread from "../../assets/products/brown-bread.jpg";
import burger from "../../assets/products/burger.jpg";
import butterCookies from "../../assets/products/butter-cookies.jpg";
import chocolateCake from "../../assets/products/chocolate-cake.jpg";
import chocolateCookies from "../../assets/products/chocolate-cookies.jpg";
import coffee from "../../assets/products/coffee.jpg";
import coldCoffee from "../../assets/products/cold-coffee.jpg";
import creamRoll from "../../assets/products/cream-roll.jpg";
import cupCake from "../../assets/products/cup-cake.jpg";
import cutlet from "../../assets/products/cutlet.jpg";
import dryFruitBarfi from "../../assets/products/dry-fruit-barfi.jpg";
import dryFruitLaddu from "../../assets/products/dry-fruit-laddu.jpg";
import eggPuff from "../../assets/products/egg-puff.jpg";
import fruitCake from "../../assets/products/fruit-cake.jpg";
import gulabJamun from "../../assets/products/gulab-jamun.jpg";
import kajuKatli from "../../assets/products/kaju-katli.jpg";
import kalakand from "../../assets/products/kalakand.jpg";
import kharaBun from "../../assets/products/khara-bun.jpg";
import lassi from "../../assets/products/lassi.jpg";
import mangoJuice from "../../assets/products/mango-juice.jpg";
import milkBread from "../../assets/products/milk-bread.jpg";
import milkCake from "../../assets/products/milk-cake.jpg";
import milkshake from "../../assets/products/milkshake.jpg";
import motichoorLaddu from "../../assets/products/motichoor-laddu.jpg";
import mysorePak from "../../assets/products/mysore-pak.jpg";
import orangeJuice from "../../assets/products/orange-juice.jpg";
import pizzaSlice from "../../assets/products/pizza-slice.jpg";
import plumCake from "../../assets/products/plum-cake.jpg";
import rasgulla from "../../assets/products/rasgulla.jpg";
import rasmalai from "../../assets/products/rasmalai.jpg";
import rusk from "../../assets/products/rusk.jpg";
import samosa from "../../assets/products/samosa.jpg";
import sandwich from "../../assets/products/sandwich.jpg";
import springRoll from "../../assets/products/spring-roll.jpg";
import tea from "../../assets/products/tea.jpg";
import vegPuff from "../../assets/products/veg-puff.jpg";
import vegRoll from "../../assets/products/veg-roll.jpg";
import seasonalGiftBox from "../../assets/products/seasonal-gift-box.jpg";
/** Map from normalized product name → local image path */
export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "apple juice": appleJuice,
  "badam milk": badamMilk,
  "badusha": badusha,
  "boondi laddu": boondiLaddu,
  "brown bread": brownBread,
  "burger": burger,
  "butter cookies": butterCookies,
  "chocolate cake": chocolateCake,
  "chocolate cookies": chocolateCookies,
  "coffee": coffee,
  "cold coffee": coldCoffee,
  "cream roll": creamRoll,
  "cup cake": cupCake,
  "cupcake": cupCake,
  "cutlet": cutlet,
  "dry fruit barfi": dryFruitBarfi,
  "dry fruit laddu": dryFruitLaddu,
  "egg puff": eggPuff,
  "fruit cake": fruitCake,
  "gulab jamun": gulabJamun,
  "kaju katli": kajuKatli,
  "kalakand": kalakand,
  "khara bun": kharaBun,
  "lassi": lassi,
  "mango juice": mangoJuice,
  "milk bread": milkBread,
  "milk cake": milkCake,
  "milkshake": milkshake,
  "motichoor laddu": motichoorLaddu,
  "mysore pak": mysorePak,
  "orange juice": orangeJuice,
  "pizza slice": pizzaSlice,
  "plum cake": plumCake,
  "rasgulla": rasgulla,
  "rasmalai": rasmalai,
  "rusk": rusk,
  "samosa": samosa,
  "sandwich": sandwich,
  "spring roll": springRoll,
  "tea": tea,
  "veg puff": vegPuff,
  "veg roll": vegRoll,
  "seasonal gift box": seasonalGiftBox,
};

/**
 * Returns the local image path for a given product name.
 * Falls back to the first available product image if no match found.
 */
export function getProductImage(productName: string): string {
  const key = productName.toLowerCase().trim();
  return PRODUCT_IMAGE_MAP[key] ?? kajuKatli;
}
