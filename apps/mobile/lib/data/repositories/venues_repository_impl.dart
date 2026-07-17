import 'package:mobile/data/datasources/venues_remote_data_source.dart';
import 'package:mobile/domain/entities/venue_detail.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/domain/repositories/venues_repository.dart';

class VenuesRepositoryImpl implements VenuesRepository {
  final VenuesRemoteDataSource _remote;

  VenuesRepositoryImpl(this._remote);

  @override
  Future<List<VenueSummary>> search({
    String? category,
    String? musicGenre,
    String? crowdType,
    String? query,
    double? lat,
    double? lng,
    double radiusM = 3000,
  }) {
    return _remote.search(
      category: category,
      musicGenre: musicGenre,
      crowdType: crowdType,
      query: query,
      lat: lat,
      lng: lng,
      radiusM: radiusM,
    );
  }

  @override
  Future<VenueDetail> getById(String id) {
    return _remote.getById(id);
  }
}
