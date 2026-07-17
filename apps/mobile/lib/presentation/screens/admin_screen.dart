import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/domain/entities/account_item.dart';
import 'package:mobile/presentation/providers/admin_provider.dart';

class AdminScreen extends ConsumerWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);

    return Scaffold(
      backgroundColor: kBackgroundColor,
      appBar: AppBar(
        backgroundColor: kBackgroundColor,
        foregroundColor: Colors.white,
        title: const Text('Admin Panel',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(adminProvider.notifier).fetchAll(),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'admin-venues',
            backgroundColor: kSurfaceColor,
            foregroundColor: kAccentColor,
            mini: true,
            onPressed: () => context.push('/admin/venues'),
            child: const Icon(Icons.location_on_rounded),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'admin-add-account',
            onPressed: () => context.push('/admin/new-account'),
            backgroundColor: kAccentColor,
            foregroundColor: Colors.black,
            icon: const Icon(Icons.person_add_rounded),
            label: const Text('Add Account', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: state.loading && state.accounts.isEmpty
          ? const Center(child: CircularProgressIndicator(color: kAccentColor))
          : state.error != null && state.accounts.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(state.error!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6))),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () =>
                              ref.read(adminProvider.notifier).fetchAll(),
                          style: FilledButton.styleFrom(
                              backgroundColor: kAccentColor,
                              foregroundColor: Colors.black),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(adminProvider.notifier).fetchAll(),
                  color: kAccentColor,
                  backgroundColor: kSurfaceColor,
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: _StatsRow(stats: state.stats),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text(
                            'Accounts (${state.accounts.length})',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                      SliverList.separated(
                        itemCount: state.accounts.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 1),
                        itemBuilder: (context, i) => _AccountTile(
                          account: state.accounts[i],
                          onToggleActive: (active) => ref
                              .read(adminProvider.notifier)
                              .toggleActive(state.accounts[i].id, active),
                        ),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 100)),
                    ],
                  ),
                ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, int> stats;

  const _StatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    final pending = stats['pendingVenues'] ?? 0;
    return Column(
      children: [
        Row(
          children: [
            _StatCard(label: 'Accounts', value: stats['accounts'] ?? 0, icon: Icons.people),
            const SizedBox(width: 10),
            _StatCard(
              label: 'Venues',
              value: stats['publishedVenues'] ?? stats['venues'] ?? 0,
              icon: Icons.location_on,
              subtitle: 'of ${stats['venues'] ?? 0} total',
            ),
            const SizedBox(width: 10),
            _StatCard(label: 'Reviews', value: stats['reviews'] ?? 0, icon: Icons.rate_review),
          ],
        ),
        if (pending > 0) ...[
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => context.push('/admin/venues'),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: kAccentColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kAccentColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.pending_outlined, color: kAccentColor, size: 18),
                  const SizedBox(width: 10),
                  Text(
                    '$pending venue suggestion${pending == 1 ? '' : 's'} pending review',
                    style: const TextStyle(color: kAccentColor, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right, color: kAccentColor, size: 18),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;
  final String? subtitle;

  const _StatCard({required this.label, required this.value, required this.icon, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: kSurfaceColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: kAccentColor, size: 18),
            const SizedBox(height: 8),
            Text(
              value.toString(),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.45))),
            if (subtitle != null)
              Text(subtitle!, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.28))),
          ],
        ),
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  final AccountItem account;
  final void Function(bool) onToggleActive;

  const _AccountTile({required this.account, required this.onToggleActive});

  Future<void> _confirmToggle(BuildContext context) async {
    final action = account.active ? 'deactivate' : 'activate';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: Text('${action[0].toUpperCase()}${action.substring(1)} account?',
            style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Text(
          '${account.active ? 'Deactivating' : 'Activating'} ${account.name} will ${account.active ? 'prevent them from logging in' : 'restore their access'}.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(action[0].toUpperCase() + action.substring(1),
                style: const TextStyle(color: kAccentColor)),
          ),
        ],
      ),
    );
    if (confirmed == true) onToggleActive(!account.active);
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = account.role == 'ADMINISTRATOR';
    final initial =
        account.name.isNotEmpty ? account.name[0].toUpperCase() : '?';

    return Container(
      color: kBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor:
                isAdmin ? kAccentColor : kSurfaceColor,
            backgroundImage: account.avatarUrl != null
                ? NetworkImage(account.avatarUrl!)
                : null,
            child: account.avatarUrl == null
                ? Text(
                    initial,
                    style: TextStyle(
                      color: isAdmin ? Colors.black : Colors.white70,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        account.name,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: account.active
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.4),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _RoleBadge(role: account.role),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  account.email,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Switch(
            value: account.active,
            onChanged: (_) => _confirmToggle(context),
            activeThumbColor: kAccentColor,
            activeTrackColor: kAccentColor.withValues(alpha: 0.3),
            inactiveThumbColor: Colors.white30,
            inactiveTrackColor: Colors.white10,
          ),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;

  const _RoleBadge({required this.role});

  Color get _color => switch (role) {
        'ADMINISTRATOR' => kAccentColor,
        'CREATOR' => const Color(0xFF60A5FA),
        _ => Colors.white38,
      };

  String get _label => switch (role) {
        'ADMINISTRATOR' => 'ADMIN',
        'CREATOR' => 'CREATOR',
        _ => 'USER',
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _label,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: _color, letterSpacing: 0.5),
      ),
    );
  }
}
