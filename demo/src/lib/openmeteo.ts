export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    temperature_2m_mean: string;
    precipitation_sum: string;
    wind_speed_10m_max: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

export interface Monthly {
  month: string;
  wind: number;
  rain: number;
  temp: number;
}

const monthMap = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};

export const getWeatherData = async ({
  lng,
  lat,
  startDate,
  endDate,
}: {
  lng: number;
  lat: number;
  startDate: string;
  endDate: string;
}): Promise<Monthly[]> => {
  const vars = ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"];
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.append("latitude", lat.toString());
  url.searchParams.append("longitude", lng.toString());
  url.searchParams.append("start_date", startDate);
  url.searchParams.append("end_date", endDate);
  url.searchParams.append("daily", vars.join(","));
  url.searchParams.append("wind_speed_unit", "kn");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const data: WeatherData = await response.json();

  const zipped = data.daily.time.map((date, index) => ({
    date,
    temp: data.daily.temperature_2m_max[index],
    wind: data.daily.wind_speed_10m_max[index],
    rain: data.daily.precipitation_sum[index],
  }));
  const monthlyData = zipped.reduce(
    (
      acc: Record<string, { count: number; rain: number; wind: number; temp: number }>,
      { date, rain, wind, temp },
    ) => {
      const month = date.slice(5, 7);

      if (!acc[month]) {
        acc[month] = { count: 0, rain: 0, wind: 0, temp: 0 };
      }

      acc[month].count += 1;
      acc[month].rain += rain;
      acc[month].wind += wind;
      acc[month].temp += temp;

      return acc;
    },
    {},
  );

  const monthly = Object.entries(monthlyData)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, { count, rain, wind, temp }]) => ({
      month: monthMap[month as keyof typeof monthMap],
      rain: rain / count,
      wind: wind / count,
      temp: temp / count,
    }));

  return monthly;
};
