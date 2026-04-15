declare namespace google.maps {
  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    bounds: LatLngBounds;
    copyrights: string;
    legs: DirectionsLeg[];
    overview_path: LatLng[];
    overview_polyline: string;
    warnings: string[];
    waypoint_order: number[];
  }

  interface DirectionsLeg {
    arrival_time?: Time;
    departure_time?: Time;
    distance?: Distance;
    duration?: Duration;
    duration_in_traffic?: Duration;
    end_address: string;
    end_location: LatLng;
    start_address: string;
    start_location: LatLng;
    steps: DirectionsStep[];
    via_waypoints: LatLng[];
  }

  interface DirectionsStep {
    distance: Distance;
    duration: Duration;
    end_location: LatLng;
    instructions: string;
    path: LatLng[];
    start_location: LatLng;
    travel_mode: TravelMode;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngBounds {
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  interface Distance {
    text: string;
    value: number;
  }

  interface Duration {
    text: string;
    value: number;
  }

  interface Time {
    text: string;
    time_zone: string;
    value: Date;
  }

  enum TravelMode {
    BICYCLING = 'BICYCLING',
    DRIVING = 'DRIVING',
    TRANSIT = 'TRANSIT',
    WALKING = 'WALKING',
  }
}
