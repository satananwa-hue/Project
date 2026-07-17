import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/datasources/auth_remote_data_source.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';

const _categories = [
  ('BAR', 'Bar'),
  ('CLUB', 'Club'),
  ('ROOFTOP', 'Rooftop'),
  ('LIVE_MUSIC', 'Live Music'),
  ('LOUNGE', 'Lounge'),
  ('OTHER', 'Other'),
];

const _geoapifyKey = String.fromEnvironment(
  'GEOAPIFY_KEY',
  defaultValue: 'REPLACE_WITH_YOUR_GEOAPIFY_KEY',
);
const _darkTileUrl =
    'https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=$_geoapifyKey';

const _bangkokCenter = LatLng(13.7563, 100.5018);

class AddVenueScreen extends ConsumerStatefulWidget {
  const AddVenueScreen({super.key});

  @override
  ConsumerState<AddVenueScreen> createState() => _AddVenueScreenState();
}

class _AddVenueScreenState extends ConsumerState<AddVenueScreen> {
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _mapCtrl = MapController();
  LatLng? _pinned;
  String _category = 'BAR';
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _mapCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _nameCtrl.text.trim().isNotEmpty &&
      _addressCtrl.text.trim().isNotEmpty &&
      _pinned != null;

  void _onMapTap(TapPosition _, LatLng latLng) {
    setState(() => _pinned = latLng);
    _mapCtrl.move(latLng, _mapCtrl.camera.zoom);
  }

  Future<void> _submit() async {
    if (!_canSubmit || _submitting) return;
    final session = ref.read(authProvider).asData?.value;
    if (session == null) return;

    setState(() => _submitting = true);
    try {
      final ds = AuthRemoteDataSource(http.Client());
      await ds.suggestVenue({
        'name': _nameCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'lat': _pinned!.latitude,
        'lng': _pinned!.longitude,
        'category': _category,
        'city': 'Bangkok',
      }, session.accessToken);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Venue added — pending publish'),
            backgroundColor: Color(0xFF1A5C1A),
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackgroundColor,
      appBar: AppBar(
        backgroundColor: kBackgroundColor,
        foregroundColor: Colors.white,
        title: const Text(
          'Add Venue',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _MapPicker(
              mapController: _mapCtrl,
              pinned: _pinned,
              onTap: _onMapTap,
            ),
            const SizedBox(height: 10),
            if (_pinned != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: kAccentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: kAccentColor.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on, color: kAccentColor, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      '${_pinned!.latitude.toStringAsFixed(5)},  ${_pinned!.longitude.toStringAsFixed(5)}',
                      style: const TextStyle(
                        color: kAccentColor,
                        fontSize: 12,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _pinned = null),
                      child: Icon(Icons.close, color: kAccentColor.withValues(alpha: 0.7), size: 14),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
            _Field(
              controller: _nameCtrl,
              label: 'Venue name',
              hint: 'e.g. Levels Club & Lounge',
              icon: Icons.location_on_outlined,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 14),
            _Field(
              controller: _addressCtrl,
              label: 'Address',
              hint: 'Street address',
              icon: Icons.map_outlined,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 20),
            Text(
              'Category',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 13),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((cat) {
                final (value, label) = cat;
                final selected = _category == value;
                return GestureDetector(
                  onTap: () => setState(() => _category = value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? kAccentColor : kSurfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: selected ? kAccentColor : Colors.white12),
                    ),
                    child: Text(
                      label,
                      style: TextStyle(
                        color: selected ? Colors.black : Colors.white60,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _canSubmit && !_submitting ? _submit : null,
                style: FilledButton.styleFrom(
                  backgroundColor: kAccentColor,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor: kSurfaceColor,
                  disabledForegroundColor: Colors.white30,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : const Text(
                        'Add Venue',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MapPicker extends StatelessWidget {
  final MapController mapController;
  final LatLng? pinned;
  final void Function(TapPosition, LatLng) onTap;

  const _MapPicker({
    required this.mapController,
    required this.pinned,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Location',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 13),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 240,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: mapController,
                  options: MapOptions(
                    initialCenter: _bangkokCenter,
                    initialZoom: 12,
                    minZoom: 3,
                    maxZoom: 17,
                    interactionOptions: const InteractionOptions(
                      flags: InteractiveFlag.pinchZoom,
                    ),
                    onTap: onTap,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: _darkTileUrl,
                      userAgentPackageName: 'com.nightcheck.mobile',
                    ),
                    if (pinned != null)
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: pinned!,
                            width: 36,
                            height: 36,
                            child: const Icon(Icons.location_on, color: kAccentColor, size: 36),
                          ),
                        ],
                      ),
                  ],
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: Column(
                    children: [
                      _ZoomBtn(
                        icon: Icons.add,
                        onTap: () => mapController.move(
                          mapController.camera.center,
                          (mapController.camera.zoom + 1).clamp(3.0, 17.0),
                        ),
                      ),
                      const SizedBox(height: 4),
                      _ZoomBtn(
                        icon: Icons.remove,
                        onTap: () => mapController.move(
                          mapController.camera.center,
                          (mapController.camera.zoom - 1).clamp(3.0, 17.0),
                        ),
                      ),
                    ],
                  ),
                ),
                if (pinned == null)
                  Positioned(
                    bottom: 10,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.touch_app_outlined, color: Colors.white70, size: 14),
                            SizedBox(width: 5),
                            Text(
                              'Tap map to pin location',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ZoomBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _ZoomBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: kSurfaceColor,
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 4)],
        ),
        child: Icon(icon, color: Colors.white70, size: 18),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final void Function(String) onChanged;

  const _Field({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
        prefixIcon: Icon(icon, color: Colors.white38, size: 20),
        filled: true,
        fillColor: kSurfaceColor,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
    );
  }
}
