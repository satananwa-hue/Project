final kLevels = [
  (level: 1, title: 'New Explorer', min: 0),
  (level: 2, title: 'Rookie Reviewer', min: 15),
  (level: 3, title: 'Neighborhood Scout', min: 75),
  (level: 4, title: 'Community Contributor', min: 250),
  (level: 5, title: 'Trusted Reviewer', min: 500),
];

({int level, String title, int min, int? nextMin, String? nextTitle})
    getLevelInfo(int points) {
  for (int i = kLevels.length - 1; i >= 0; i--) {
    if (points >= kLevels[i].min) {
      final hasNext = i < kLevels.length - 1;
      return (
        level: kLevels[i].level,
        title: kLevels[i].title,
        min: kLevels[i].min,
        nextMin: hasNext ? kLevels[i + 1].min : null,
        nextTitle: hasNext ? kLevels[i + 1].title : null,
      );
    }
  }
  return (level: 1, title: 'New Explorer', min: 0, nextMin: 15, nextTitle: 'Rookie Reviewer');
}

String levelAssetPath(int level) => level <= 3
    ? 'assets/images/levels/level_$level.svg'
    : 'assets/images/levels/level_$level.png';

bool levelAssetIsSvg(int level) => level <= 3;
