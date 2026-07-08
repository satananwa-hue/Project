import 'package:mobile/data/datasources/venues_remote_data_source.dart';
import 'package:mobile/domain/entities/venue_category.dart';
import 'package:mobile/domain/entities/venue_detail.dart';
import 'package:mobile/domain/entities/venue_summary.dart';
import 'package:mobile/domain/repositories/venues_repository.dart';

class VenuesRepositoryImpl implements VenuesRepository {
  final VenuesRemoteDataSource _remote;

  VenuesRepositoryImpl(this._remote);

  @override
  Future<List<VenueSummary>> search({String? categoryId, String? query}) {
    return _remote.search(categoryId: categoryId, query: query);
  }

  @override
  Future<VenueDetail> getBySlug(String slug) {
    return _remote.getBySlug(slug);
  }

  @override
  Future<List<VenueCategory>> listCategories() {
    return _remote.listCategories();
  }
}
