import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';

const _categories = [
  ('BAR', 'Bar'),
  ('CLUB', 'Club'),
  ('ROOFTOP', 'Rooftop'),
  ('LIVE_MUSIC', 'Live Music'),
  ('LOUNGE', 'Lounge'),
  ('OTHER', 'Other'),
];

class CategoryFilterBar extends ConsumerWidget {
  const CategoryFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedCategoryProvider);

    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _FilterChip(
            label: 'All',
            selected: selected == null,
            onSelected: () => ref.read(selectedCategoryProvider.notifier).state = null,
          ),
          const SizedBox(width: 8),
          for (final (value, label) in _categories) ...[
            _FilterChip(
              label: label,
              selected: selected == value,
              onSelected: () => ref.read(selectedCategoryProvider.notifier).state = value,
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _FilterChip({required this.label, required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: kAccentColor,
      backgroundColor: kSurfaceColor,
      labelStyle: TextStyle(color: selected ? Colors.black : Colors.white),
      side: BorderSide.none,
    );
  }
}
