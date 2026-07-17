import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/datasources/admin_remote_data_source.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';

final _adminVenuesProvider = FutureProvider.autoDispose<List<VenueSummary>>((ref) async {
  final token = ref.watch(authProvider).asData?.value?.accessToken ?? '';
  return AdminRemoteDataSource(http.Client(), token).fetchVenues();
});

class AdminVenuesScreen extends ConsumerWidget {
  const AdminVenuesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final venuesAsync = ref.watch(_adminVenuesProvider);

    return Scaffold(
      backgroundColor: kBackgroundColor,
      appBar: AppBar(
        backgroundColor: kBackgroundColor,
        foregroundColor: Colors.white,
        title: const Text('Venues', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_adminVenuesProvider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await context.push('/venues/add');
          ref.invalidate(_adminVenuesProvider);
        },
        backgroundColor: kAccentColor,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_location_alt_rounded),
        label: const Text('Add Venue', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: venuesAsync.when(
        data: (venues) => venues.isEmpty
            ? const Center(child: Text('No venues yet.', style: TextStyle(color: Colors.white54)))
            : RefreshIndicator(
                onRefresh: () => ref.refresh(_adminVenuesProvider.future),
                color: kAccentColor,
                backgroundColor: kSurfaceColor,
                child: ListView.separated(
                  padding: const EdgeInsets.only(bottom: 100),
                  itemCount: venues.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 1),
                  itemBuilder: (context, i) => _VenueTile(
                    venue: venues[i],
                    onDelete: () => _confirmDelete(context, ref, venues[i]),
                    onTap: () => context.push('/venues/${venues[i].id}'),
                    onTogglePublish: (published) => _togglePublish(context, ref, venues[i].id, published),
                  ),
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator(color: kAccentColor)),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(e.toString().replaceFirst('Exception: ', ''),
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => ref.invalidate(_adminVenuesProvider),
                  style: FilledButton.styleFrom(backgroundColor: kAccentColor, foregroundColor: Colors.black),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, VenueSummary venue) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: const Text('Delete venue?', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Text(
          'Delete "${venue.name}"? This cannot be undone. Venues with reviews cannot be deleted.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 14),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final token = ref.read(authProvider).asData?.value?.accessToken ?? '';
    try {
      await AdminRemoteDataSource(http.Client(), token).deleteVenue(venue.id);
      ref.invalidate(_adminVenuesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red.shade800),
        );
      }
    }
  }

  Future<void> _togglePublish(BuildContext context, WidgetRef ref, String id, bool published) async {
    final token = ref.read(authProvider).asData?.value?.accessToken ?? '';
    try {
      await AdminRemoteDataSource(http.Client(), token).updateVenue(id, {'isPublished': published});
      ref.invalidate(_adminVenuesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
      ref.invalidate(_adminVenuesProvider);
    }
  }
}

class _VenueTile extends StatelessWidget {
  final VenueSummary venue;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final void Function(bool) onTogglePublish;

  const _VenueTile({required this.venue, required this.onTap, required this.onDelete, required this.onTogglePublish});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: kBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: onTap,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(venue.name,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis),
                      ),
                      const SizedBox(width: 8),
                      _CategoryBadge(category: venue.category),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${venue.reviewCount} review${venue.reviewCount == 1 ? '' : 's'}',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          Switch(
            value: venue.isPublished,
            onChanged: onTogglePublish,
            activeThumbColor: kAccentColor,
            activeTrackColor: kAccentColor.withValues(alpha: 0.3),
            inactiveThumbColor: Colors.white30,
            inactiveTrackColor: Colors.white10,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white30, size: 20),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _CategoryBadge extends StatelessWidget {
  final String category;

  const _CategoryBadge({required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        category.replaceAll('_', ' '),
        style: const TextStyle(fontSize: 9, color: Colors.white38, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }
}
