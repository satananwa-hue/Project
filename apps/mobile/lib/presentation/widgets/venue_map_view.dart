import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/venue_summary.dart';

const bangkokCenter = LatLng(13.7563, 100.5018);

const _geoapifyKey = String.fromEnvironment(
  'GEOAPIFY_KEY',
  defaultValue: 'REPLACE_WITH_YOUR_GEOAPIFY_KEY',
);
const _darkTileUrl =
    'https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=$_geoapifyKey';

class VenueMapView extends StatefulWidget {
  final List<VenueSummary> venues;
  final void Function(VenueSummary venue)? onMarkerTap;
  final MapController? controller;
  final LatLng? center;
  final LatLng? userPosition;
  final double zoom;

  const VenueMapView({
    super.key,
    required this.venues,
    this.onMarkerTap,
    this.controller,
    this.center,
    this.userPosition,
    this.zoom = 11,
  });

  @override
  State<VenueMapView> createState() => _VenueMapViewState();
}

class _VenueMapViewState extends State<VenueMapView> {
  late final MapController _ctrl;
  bool _ownsController = false;

  @override
  void initState() {
    super.initState();
    if (widget.controller != null) {
      _ctrl = widget.controller!;
    } else {
      _ctrl = MapController();
      _ownsController = true;
    }
  }

  @override
  void dispose() {
    if (_ownsController) _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final initialCenter = widget.center ?? widget.userPosition ?? bangkokCenter;

    return Stack(
      children: [
        FlutterMap(
          mapController: _ctrl,
          options: MapOptions(initialCenter: initialCenter, initialZoom: widget.zoom, minZoom: 3, maxZoom: 17),
          children: [
            TileLayer(
              urlTemplate: _darkTileUrl,
              userAgentPackageName: 'com.nightcheck.mobile',
            ),
            MarkerLayer(
              markers: [
                if (widget.userPosition != null)
                  Marker(
                    point: widget.userPosition!,
                    width: 20,
                    height: 20,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 4)],
                      ),
                    ),
                  ),
                ...widget.venues.map((venue) => Marker(
                      point: LatLng(venue.lat, venue.lng),
                      width: 36,
                      height: 36,
                      child: GestureDetector(
                        onTap: widget.onMarkerTap == null ? null : () => widget.onMarkerTap!(venue),
                        child: const Icon(Icons.location_on, color: kAccentColor, size: 36),
                      ),
                    )),
              ],
            ),
          ],
        ),

      ],
    );
  }
}
