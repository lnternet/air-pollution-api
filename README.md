# air-pollution-api
For Space Apps Challenge

```
{
  getLatest(lat: 10, long: 10) {
    latitude,
    longitude,
    aod1
  }
}
```


```
{
  getHistorical(lat: 33.831, long: -117.939, n:5) {
    latitude,
    longitude,
    aod1
  }
}
```


```
{
	getStations(minLat: 56.065, minLong: 21.182, maxLat: 54.315, maxLong: 25.481) {
  	name,
    latitude,
    longitude,
    aqi
	}
}
```