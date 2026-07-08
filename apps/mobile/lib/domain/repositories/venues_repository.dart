import '../entities/venue_category.dart';
import '../entities/venue_detail.dart';
import '../entities/venue_summary.dart';

abstract class VenuesRepository {
  Future<List<VenueSummary>> search({
    String? categoryId,
    String? query,
    double? lat,
    double? lng,
  });

  Future<VenueDetail> getBySlug(String slug);

  Future<List<VenueCategory>> listCategories();
}
