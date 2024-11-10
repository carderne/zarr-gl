export const SOURCE = "https://weathermapdata.rdrn.me/era5_2015_2020_l5.zarr";
export const STYLE = "mapbox://styles/carderne/cm25xy9gj00g601pl3cpmhwhj?fresh=true";
export const ACCESS_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY20yNGxpbnBsMGdxcTJqczZzZzB3YXdkZyJ9.tE9jMqijgw8GWYTvVQS4dQ";

export const VARIABLES = {
  all_ok: {
    title: "Crap",
    emoji: "💩",
    select: "Great Days",
    desc: "Perfect days meeting all the below criteria!",
    adj: "great",
  },
  wind_ok: {
    title: "Windy",
    emoji: "💨",
    select: "Calm Days",
    desc: "Days where the wind never goes over 19 knots",
    adj: "calm",
  },
  rain_ok: {
    title: "Rainy",
    emoji: "☔️",
    select: "Dry Days",
    desc: "Days with less than 1mm of rain",
    adj: "dry",
  },
  temp_ok: {
    title: "Cold",
    emoji: "🥶",
    select: "Warm Days",
    desc: "Days where the max temperature is between 16 and 27 °C",
    adj: "warm",
  },
};
export type Variable = keyof typeof VARIABLES;
