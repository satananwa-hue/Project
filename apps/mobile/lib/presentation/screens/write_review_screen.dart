import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/datasources/reviews_remote_data_source.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';

class WriteReviewScreen extends ConsumerStatefulWidget {
  final String venueId;
  final String venueName;
  final String venueCategory;

  const WriteReviewScreen({
    super.key,
    required this.venueId,
    required this.venueName,
    required this.venueCategory,
  });

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  int _overallRating = 0;
  int _foodRating = 0;
  int _serviceRating = 0;
  int _atmosphereRating = 0;
  final _commentController = TextEditingController();
  final _musicNotesController = TextEditingController();
  final _priceNotesController = TextEditingController();
  final _crowdNotesController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    _musicNotesController.dispose();
    _priceNotesController.dispose();
    _crowdNotesController.dispose();
    super.dispose();
  }

  int get _bonusPoints => _commentController.text.trim().length >= 200 ? 5 : 0;

  int get _notesPoints {
    int pts = 0;
    if (_musicNotesController.text.trim().isNotEmpty) pts += 2;
    if (_priceNotesController.text.trim().isNotEmpty) pts += 2;
    if (_crowdNotesController.text.trim().isNotEmpty) pts += 2;
    return pts;
  }

  int get _totalPoints {
    int pts = 0;
    if (_overallRating > 0) pts += 1;
    if (_commentController.text.trim().isNotEmpty) pts += 10;
    pts += _bonusPoints;
    pts += _notesPoints;
    return pts;
  }

  List<String> get _tags {
    return [
      if (_foodRating > 0) 'food-$_foodRating',
      if (_serviceRating > 0) 'service-$_serviceRating',
      if (_atmosphereRating > 0) 'atmosphere-$_atmosphereRating',
    ];
  }

  bool get _canSubmit =>
      _overallRating > 0 && _commentController.text.trim().isNotEmpty;

  Future<void> _submit() async {
    if (!_canSubmit || _submitting) return;

    final session = ref.read(authProvider).asData?.value;
    if (session == null) return;

    setState(() => _submitting = true);

    try {
      final reviewData = await ReviewsRemoteDataSource(http.Client()).createReview(
        accessToken: session.accessToken,
        venueId: widget.venueId,
        rating: _overallRating,
        textBody: _commentController.text.trim(),
        tags: _tags,
        musicGenreNotes: _musicNotesController.text.trim().isNotEmpty ? _musicNotesController.text.trim() : null,
        priceLevelNotes: _priceNotesController.text.trim().isNotEmpty ? _priceNotesController.text.trim() : null,
        crowdNotes: _crowdNotesController.text.trim().isNotEmpty ? _crowdNotesController.text.trim() : null,
      );

      if (mounted) {
        final reviewId = reviewData['id'] as String? ?? '';
        final totalPts = _totalPoints;
        final bonusPts = _bonusPoints;
        final notesPts = _notesPoints;
        final ratingPts = _overallRating > 0 ? 1 : 0;
        final reviewPts = _commentController.text.trim().isNotEmpty ? 10 : 0;
        ref.invalidate(venuesSearchProvider);
        ref.invalidate(venueDetailProvider(widget.venueId));
        context.pushReplacement('/review-submitted', extra: {
          'venueName': widget.venueName,
          'venueCategory': widget.venueCategory,
          'reviewId': reviewId,
          'reviewText': _commentController.text.trim(),
          'totalPoints': totalPts,
          'ratingPoints': ratingPts,
          'reviewPoints': reviewPts,
          'bonusPoints': bonusPts,
          'notesPoints': notesPts,
          'overallRating': _overallRating,
          'foodRating': _foodRating,
          'serviceRating': _serviceRating,
          'atmosphereRating': _atmosphereRating,
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackgroundColor,
      appBar: AppBar(
        backgroundColor: kBackgroundColor,
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Write a Review',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            Text(
              widget.venueName,
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.55),
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall rating
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                color: kSurfaceColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    'Your overall rating',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _StarRow(
                    rating: _overallRating,
                    size: 44,
                    onChanged: (r) => setState(() => _overallRating = r),
                  ),
                  if (_overallRating > 0) ...[
                    const SizedBox(height: 10),
                    Text(
                      _ratingLabel(_overallRating),
                      style: TextStyle(
                        color: kAccentColor.withValues(alpha: 0.9),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Comment
            TextField(
              controller: _commentController,
              maxLines: 5,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Tell others what you think...',
                hintStyle:
                    TextStyle(color: Colors.white.withValues(alpha: 0.35)),
                filled: true,
                fillColor: kSurfaceColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
            const SizedBox(height: 6),
            _CharCounter(count: _commentController.text.trim().length),
            const SizedBox(height: 18),

            // Sub-ratings
            Text(
              'More Details',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Optional — no extra points',
              style:
                  TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
            ),
            const SizedBox(height: 14),
            Container(
              decoration: BoxDecoration(
                color: kSurfaceColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  _SubRatingRow(
                    label: 'Food',
                    icon: Icons.restaurant_outlined,
                    rating: _foodRating,
                    onChanged: (r) => setState(() => _foodRating = r),
                    showDivider: true,
                  ),
                  _SubRatingRow(
                    label: 'Service',
                    icon: Icons.people_outline,
                    rating: _serviceRating,
                    onChanged: (r) => setState(() => _serviceRating = r),
                    showDivider: true,
                  ),
                  _SubRatingRow(
                    label: 'Atmosphere',
                    icon: Icons.nightlife,
                    rating: _atmosphereRating,
                    onChanged: (r) => setState(() => _atmosphereRating = r),
                    showDivider: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Optional notes
            Text(
              'Extra Notes',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Optional — earn +2 points per note',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
            ),
            const SizedBox(height: 14),
            _NotesField(
              controller: _musicNotesController,
              label: 'Music genre notes',
              hint: 'e.g. Deep house, live DJ until 4am',
            ),
            const SizedBox(height: 10),
            _NotesField(
              controller: _priceNotesController,
              label: 'Price notes',
              hint: 'e.g. ฿200 cover, cocktails ฿350',
            ),
            const SizedBox(height: 10),
            _NotesField(
              controller: _crowdNotesController,
              label: 'Crowd notes',
              hint: 'e.g. Mixed expats and locals, 25–35 age range',
            ),
            const SizedBox(height: 24),

            // Live points preview
            if (_overallRating > 0 || _commentController.text.trim().isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: kAccentColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kAccentColor.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: kAccentColor, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '$_totalPoints pts',
                      style: const TextStyle(color: kAccentColor, fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          if (_overallRating > 0) _PtsPill('+1 ★'),
                          if (_commentController.text.trim().isNotEmpty) _PtsPill('+10 review'),
                          if (_bonusPoints > 0) _PtsPill('+5 bonus'),
                          if (_notesPoints > 0) _PtsPill('+$_notesPoints notes'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _canSubmit && !_submitting ? _submit : null,
                style: FilledButton.styleFrom(
                  backgroundColor: kAccentColor,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor: kSurfaceColor,
                  disabledForegroundColor: Colors.white30,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.black),
                      )
                    : const Text(
                        'Submit Review',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _ratingLabel(int r) => switch (r) {
        1 => 'Terrible',
        2 => 'Poor',
        3 => 'OK',
        4 => 'Good',
        5 => 'Excellent',
        _ => '',
      };
}

class _StarRow extends StatelessWidget {
  final int rating;
  final double size;
  final void Function(int) onChanged;

  const _StarRow(
      {required this.rating, required this.size, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        return GestureDetector(
          onTap: () => onChanged(i + 1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Icon(
              i < rating ? Icons.star_rounded : Icons.star_border_rounded,
              color: i < rating ? kAccentColor : Colors.white24,
              size: size,
            ),
          ),
        );
      }),
    );
  }
}

class _NotesField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;

  const _NotesField({required this.controller, required this.label, required this.hint});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: 2,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 12),
        filled: true,
        fillColor: kSurfaceColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.all(12),
      ),
    );
  }
}

class _CharCounter extends StatelessWidget {
  final int count;

  const _CharCounter({required this.count});

  @override
  Widget build(BuildContext context) {
    final hasBonus = count >= 200;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Row(
        children: [
          if (hasBonus) ...[
            const Icon(Icons.check_circle_rounded, color: kAccentColor, size: 13),
            const SizedBox(width: 4),
          ],
          Text(
            hasBonus ? 'Bonus unlocked! (+5 pts)' : '$count / 200 chars  ·  +5 pts when you hit 200',
            style: TextStyle(
              color: hasBonus ? kAccentColor : Colors.white.withValues(alpha: 0.35),
              fontSize: 11,
              fontWeight: hasBonus ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

class _PtsPill extends StatelessWidget {
  final String label;

  const _PtsPill(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: kAccentColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label, style: const TextStyle(color: kAccentColor, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}

class _SubRatingRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final int rating;
  final void Function(int) onChanged;
  final bool showDivider;

  const _SubRatingRow({
    required this.label,
    required this.icon,
    required this.rating,
    required this.onChanged,
    required this.showDivider,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 18, color: Colors.white38),
              const SizedBox(width: 10),
              SizedBox(
                width: 80,
                child: Text(
                  label,
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75), fontSize: 14),
                ),
              ),
              _StarRow(rating: rating, size: 22, onChanged: onChanged),
              const Spacer(),
              Text(
                rating > 0 ? '$rating/5' : '–',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(
              height: 1,
              color: Colors.white.withValues(alpha: 0.06),
              indent: 16,
              endIndent: 16),
      ],
    );
  }
}
