import '../entities/venue_detail.dart';
import '../entities/venue_summary.dart';

abstract class VenuesRepository {
  Future<List<VenueSummary>> search({
    String? category,
    String? musicGenre,
    String? crowdType,
    String? query,
    double? lat,
    double? lng,
    double radiusM = 3000,
  });

  Future<VenueDetail> getById(String id);
}
