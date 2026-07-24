import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/utils/level_utils.dart';
import 'package:mobile/data/datasources/reviews_remote_data_source.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/widgets/level_avatar.dart';

class ReviewSubmittedScreen extends ConsumerStatefulWidget {
  final String venueName;
  final String venueCategory;
  final String reviewId;
  final String reviewText;
  final int totalPoints;
  final int ratingPoints;
  final int reviewPoints;
  final int bonusPoints;
  final int notesPoints;
  final int overallRating;
  final int foodRating;
  final int serviceRating;
  final int atmosphereRating;

  const ReviewSubmittedScreen({
    super.key,
    required this.venueName,
    required this.venueCategory,
    required this.reviewId,
    required this.reviewText,
    required this.totalPoints,
    required this.ratingPoints,
    required this.reviewPoints,
    required this.bonusPoints,
    required this.notesPoints,
    this.overallRating = 0,
    this.foodRating = 0,
    this.serviceRating = 0,
    this.atmosphereRating = 0,
  });

  @override
  ConsumerState<ReviewSubmittedScreen> createState() =>
      _ReviewSubmittedScreenState();
}

class _ReviewSubmittedScreenState extends ConsumerState<ReviewSubmittedScreen> {
  late int _displayedTotal;
  bool _shareClaimed = false;
  bool _sharing = false;

  @override
  void initState() {
    super.initState();
    _displayedTotal = widget.totalPoints;
  }

  String get _categoryLabel =>
      widget.venueCategory.toLowerCase().replaceAll('_', ' ');

  Future<void> _claimShare(String platform) async {
    final session = ref.read(authProvider).asData?.value;
    if (session == null || _shareClaimed || _sharing) return;

    setState(() => _sharing = true);
    try {
      await ReviewsRemoteDataSource(http.Client()).claimSocialShare(
        reviewId: widget.reviewId,
        accessToken: session.accessToken,
      );
      setState(() {
        _shareClaimed = true;
        _sharing = false;
        _displayedTotal += 5;
      });
      if (mounted) {
        _showShareCard(
          session.name,
          session.points + _displayedTotal,
          widget.overallRating,
          widget.foodRating,
          widget.serviceRating,
          widget.atmosphereRating,
        );
      }
    } catch (e) {
      setState(() => _sharing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  void _showShareCard(
    String userName,
    int totalUserPoints,
    int overallRating,
    int foodRating,
    int serviceRating,
    int atmosphereRating,
  ) {
    final info = getLevelInfo(totalUserPoints);
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.88),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Share card ──────────────────────────────────────────────
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1C1C30), Color(0xFF0D0D1A)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: kAccentColor.withValues(alpha: 0.35),
                  width: 1.5,
                ),
              ),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // App branding
                  Row(
                    children: [
                      const Icon(Icons.nightlight_round, color: kAccentColor, size: 13),
                      const SizedBox(width: 5),
                      const Text(
                        'NightCheck',
                        style: TextStyle(
                          color: kAccentColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.4,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Main row: avatar | venue tag + review info ──
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Circular level avatar
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: kAccentColor, width: 2.5),
                          color: const Color(0xFF0D0D1A),
                        ),
                        child: ClipOval(
                          child: LevelAvatar(level: info.level, size: 88),
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Right column
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Venue name — dashed "location sticker"
                            _DashedTag(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.location_on_rounded,
                                      color: kAccentColor, size: 12),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      widget.venueName,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: kAccentColor,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.2,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Star rating (overall only)
                            Row(
                              children: List.generate(5, (i) => Padding(
                                padding: const EdgeInsets.only(right: 3),
                                child: Icon(
                                  i < overallRating
                                      ? Icons.star_rounded
                                      : Icons.star_border_rounded,
                                  color: i < overallRating
                                      ? kAccentColor
                                      : Colors.white.withValues(alpha: 0.2),
                                  size: 20,
                                ),
                              )),
                            ),
                            const SizedBox(height: 8),

                            // Review text the user wrote
                            if (widget.reviewText.isNotEmpty)
                              Text(
                                widget.reviewText,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.75),
                                  fontSize: 12,
                                  height: 1.45,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 4),
                ],
              ),
            ),

            const SizedBox(height: 14),
            Text(
              'Screenshot & share to your story!',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close', style: TextStyle(color: kAccentColor)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white70),
          onPressed: () => context.go('/'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 32),

              // Check icon
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: kAccentColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: kAccentColor,
                  size: 52,
                ),
              ),
              const SizedBox(height: 24),

              // Points
              Text(
                '+$_displayedTotal points',
                style: const TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.bold,
                  color: kAccentColor,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Thanks for helping others discover\ntheir next $_categoryLabel',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.white.withValues(alpha: 0.75),
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),

              // Breakdown card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: kSurfaceColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    if (widget.ratingPoints > 0)
                      _PointRow(label: 'Rating', points: widget.ratingPoints),
                    if (widget.reviewPoints > 0)
                      _PointRow(label: 'Review', points: widget.reviewPoints),
                    if (widget.bonusPoints > 0)
                      _PointRow(
                          label: 'Bonus (200+ chars)',
                          points: widget.bonusPoints),
                    if (widget.notesPoints > 0)
                      _PointRow(
                          label: 'Extra notes', points: widget.notesPoints),
                    if (_shareClaimed)
                      _PointRow(label: 'Social share', points: 5),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Social share section
              if (!_shareClaimed) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: kSurfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: kAccentColor.withValues(alpha: 0.25),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.share_outlined,
                              color: kAccentColor, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Share to earn +5 points',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Post your review to Instagram or Facebook story',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.45),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _ShareButton(
                              icon: Icons.camera_alt_outlined,
                              label: 'Instagram',
                              color: const Color(0xFFE1306C),
                              loading: _sharing,
                              onTap: () => _claimShare('instagram'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _ShareButton(
                              icon: Icons.facebook,
                              label: 'Facebook',
                              color: const Color(0xFF1877F2),
                              loading: _sharing,
                              onTap: () => _claimShare('facebook'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => context.go('/'),
                  style: FilledButton.styleFrom(
                    backgroundColor: kAccentColor,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    'RATE ANOTHER PLACE',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/'),
                child: Text(
                  'Back to map',
                  style:
                      TextStyle(color: Colors.white.withValues(alpha: 0.45)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PointRow extends StatelessWidget {
  final String label;
  final int points;

  const _PointRow({required this.label, required this.points});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          const Icon(Icons.add_circle_outline, size: 16, color: kAccentColor),
          const SizedBox(width: 10),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7), fontSize: 14)),
          const Spacer(),
          Text(
            '+$points',
            style: const TextStyle(
              color: kAccentColor,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

// Dashed border "location sticker" used in the share card
class _DashedTag extends StatelessWidget {
  final Widget child;
  const _DashedTag({required this.child});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: child,
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = kAccentColor.withValues(alpha: 0.65)
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;

    const dashLen = 5.0;
    const gapLen = 4.0;
    const r = 8.0;
    final source = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(r),
      ));

    final dashed = Path();
    for (final m in source.computeMetrics()) {
      double d = 0;
      bool draw = true;
      while (d < m.length) {
        final len = draw ? dashLen : gapLen;
        if (draw) dashed.addPath(m.extractPath(d, d + len), Offset.zero);
        d += len;
        draw = !draw;
      }
    }
    canvas.drawPath(dashed, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}


class _ShareButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool loading;
  final VoidCallback onTap;

  const _ShareButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.loading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
        ),
        child: loading
            ? Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: color),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: color, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
