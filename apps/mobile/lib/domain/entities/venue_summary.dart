const _priceRangeSymbols = {
  'BUDGET': '\$',
  'MODERATE': '\$\$',
  'UPSCALE': '\$\$\$',
  'LUXURY': '\$\$\$\$',
};

class VenueSummary {
  final String id;
  final String name;
  final String category;
  final String address;
  final double lat;
  final double lng;
  final String city;
  final int? coverCharge;
  final List<String> musicGenres;
  final List<String> crowdTypes;
  final String? priceRange;
  final List<String> photos;
  final bool isPublished;
  final double? topRating;
  final int reviewCount;
  final double? distanceM;

  const VenueSummary({
    required this.id,
    required this.name,
    required this.category,
    required this.address,
    required this.lat,
    required this.lng,
    required this.city,
    this.coverCharge,
    required this.musicGenres,
    required this.crowdTypes,
    this.priceRange,
    required this.photos,
    required this.isPublished,
    this.topRating,
    required this.reviewCount,
    this.distanceM,
  });

  String? get priceRangeSymbol => priceRange != null ? _priceRangeSymbols[priceRange] : null;
  String? get coverPhoto => photos.isNotEmpty ? photos.first : null;
}
