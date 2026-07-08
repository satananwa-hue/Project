import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/venues_providers.dart';

class CategoryFilterBar extends ConsumerWidget {
  const CategoryFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final selected = ref.watch(selectedCategoryIdProvider);

    return categoriesAsync.when(
      data: (categories) => SizedBox(
        height: 40,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          children: [
            _FilterChip(
              label: 'All',
              selected: selected == null,
              onSelected: () => ref.read(selectedCategoryIdProvider.notifier).state = null,
            ),
            const SizedBox(width: 8),
            for (final category in categories) ...[
              _FilterChip(
                label: category.name,
                selected: selected == category.id,
                onSelected: () =>
                    ref.read(selectedCategoryIdProvider.notifier).state = category.id,
              ),
              const SizedBox(width: 8),
            ],
          ],
        ),
      ),
      loading: () => const SizedBox(height: 40),
      error: (_, _) => const SizedBox(height: 40),
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
