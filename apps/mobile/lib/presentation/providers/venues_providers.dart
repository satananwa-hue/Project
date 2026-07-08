import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/data/datasources/venues_remote_data_source.dart';
import 'package:mobile/data/repositories/venues_repository_impl.dart';
import 'package:mobile/domain/entities/venue_category.dart';
import 'package:mobile/domain/entities/venue_detail.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/domain/repositories/venues_repository.dart';

final _httpClientProvider = Provider<http.Client>((ref) => http.Client());

final _venuesRemoteDataSourceProvider = Provider<VenuesRemoteDataSource>((ref) {
  return VenuesRemoteDataSource(ref.watch(_httpClientProvider));
});

final venuesRepositoryProvider = Provider<VenuesRepository>((ref) {
  return VenuesRepositoryImpl(ref.watch(_venuesRemoteDataSourceProvider));
});

final categoriesProvider = FutureProvider<List<VenueCategory>>((ref) {
  return ref.watch(venuesRepositoryProvider).listCategories();
});

/// null means "All categories".
final selectedCategoryIdProvider = StateProvider<String?>((ref) => null);

final searchQueryProvider = StateProvider<String>((ref) => '');

final venuesSearchProvider = FutureProvider.autoDispose<List<VenueSummary>>((ref) {
  final categoryId = ref.watch(selectedCategoryIdProvider);
  final query = ref.watch(searchQueryProvider);
  return ref.watch(venuesRepositoryProvider).search(categoryId: categoryId, query: query);
});

final venueDetailProvider = FutureProvider.family<VenueDetail, String>((ref, slug) {
  return ref.watch(venuesRepositoryProvider).getBySlug(slug);
});
