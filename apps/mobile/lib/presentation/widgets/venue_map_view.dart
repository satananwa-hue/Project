import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';

const bangkokCenter = LatLng(13.7563, 100.5018);

/// CARTO's free dark basemap - no API key/billing account needed, unlike
/// Google Maps, and matches the app's dark theme. Same tile source the web
/// app uses (apps/web/src/components/venue-map.tsx).
const _darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const _darkTileSubdomains = ['a', 'b', 'c', 'd'];

class VenueMapView extends StatelessWidget {
  final List<VenueSummary> venues;
  final void Function(VenueSummary venue)? onMarkerTap;
  final MapController? controller;
  final LatLng? center;
  final double zoom;

  const VenueMapView({
    super.key,
    required this.venues,
    this.onMarkerTap,
    this.controller,
    this.center,
    this.zoom = 13,
  });

  @override
  Widget build(BuildContext context) {
    final initialCenter = center ?? (venues.isNotEmpty
        ? LatLng(venues.first.lat, venues.first.lng)
        : bangkokCenter);

    return FlutterMap(
      mapController: controller,
      options: MapOptions(initialCenter: initialCenter, initialZoom: zoom),
      children: [
        TileLayer(
          urlTemplate: _darkTileUrl,
          subdomains: _darkTileSubdomains,
          userAgentPackageName: 'com.chiwitrakmaochaaowelarakkhrai.mobile',
        ),
        MarkerLayer(
          markers: venues.map((venue) {
            return Marker(
              point: LatLng(venue.lat, venue.lng),
              width: 36,
              height: 36,
              child: GestureDetector(
                onTap: onMarkerTap == null ? null : () => onMarkerTap!(venue),
                child: const Icon(Icons.location_on, color: kAccentColor, size: 36),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
