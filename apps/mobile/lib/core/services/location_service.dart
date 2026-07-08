import 'package:geolocator/geolocator.dart';

/// Thin wrapper around geolocator: returns null instead of throwing whenever
/// location isn't available (permission denied, service disabled, etc.) so
/// callers can fall back to the city-wide list rather than crash.
class LocationService {
  Future<Position?> getCurrentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
    } catch (_) {
      return null;
    }
  }
}
