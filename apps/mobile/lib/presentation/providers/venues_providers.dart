import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/services/location_service.dart';
import 'package:mobile/data/datasources/venues_remote_data_source.dart';
import 'package:mobile/data/repositories/venues_repository_impl.dart';
import 'package:mobile/domain/entities/venue_detail.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/domain/repositories/venues_repository.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';

final _httpClientProvider = Provider<http.Client>((ref) => http.Client());

final _venuesRemoteDataSourceProvider = Provider<VenuesRemoteDataSource>((ref) {
  return VenuesRemoteDataSource(ref.watch(_httpClientProvider));
});

final venuesRepositoryProvider = Provider<VenuesRepository>((ref) {
  return VenuesRepositoryImpl(ref.watch(_venuesRemoteDataSourceProvider));
});

final locationServiceProvider = Provider<LocationService>((ref) => LocationService());

/// Auto-requested on first build — resolves to null if not logged in or permission denied.
final autoLocationProvider = FutureProvider<Position?>((ref) async {
  final session = await ref.watch(authProvider.future);
  if (session == null) return null;
  return ref.read(locationServiceProvider).getCurrentPosition();
});

/// Overrides autoLocation when user taps the "re-center" FAB.
final userPositionProvider = StateProvider<Position?>((ref) => null);

/// null = All categories.
final selectedCategoryProvider = StateProvider<String?>((ref) => null);

/// null = Any music genre.
final selectedMusicGenreProvider = StateProvider<String?>((ref) => null);

/// null = Any crowd type.
final selectedCrowdTypeProvider = StateProvider<String?>((ref) => null);

final searchQueryProvider = StateProvider<String>((ref) => '');

final venuesSearchProvider = FutureProvider.autoDispose<List<VenueSummary>>((ref) async {
  final category = ref.watch(selectedCategoryProvider);
  final musicGenre = ref.watch(selectedMusicGenreProvider);
  final crowdType = ref.watch(selectedCrowdTypeProvider);
  final query = ref.watch(searchQueryProvider);

  // Manual re-center overrides auto-detected position
  final manualPos = ref.watch(userPositionProvider);
  final autoPos = ref.watch(autoLocationProvider).asData?.value;
  final position = manualPos ?? autoPos;

  return ref.watch(venuesRepositoryProvider).search(
    category: category,
    musicGenre: musicGenre,
    crowdType: crowdType,
    query: query,
    lat: position?.latitude,
    lng: position?.longitude,
    radiusM: 3000,
  );
});

final venueDetailProvider = FutureProvider.autoDispose.family<VenueDetail, String>((ref, id) {
  return ref.watch(venuesRepositoryProvider).getById(id);
});
