import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/utils/level_utils.dart';
import 'package:mobile/data/datasources/auth_remote_data_source.dart';
import 'package:mobile/presentation/widgets/level_avatar.dart';
import 'package:mobile/domain/entities/creator_session.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';

class ProfileAvatarButton extends ConsumerWidget {
  const ProfileAvatarButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    return GestureDetector(
      onTap: () {
        authAsync.whenData((session) {
          if (session == null) {
            _showLoginSheet(context);
          } else {
            _showProfileSheet(context, session);
          }
        });
      },
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: authAsync.when(
          data: (session) => _Avatar(session: session),
          loading: () => const _AvatarShell(child: CircularProgressIndicator(color: kAccentColor, strokeWidth: 2)),
          error: (_, _) => const _AvatarShell(child: Icon(Icons.person, color: Colors.white54, size: 20)),
        ),
      ),
    );
  }

  void _showLoginSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: kSurfaceColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('NightCheck', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Discover Bangkok nightlife', style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 14)),
            const SizedBox(height: 24),
            const Divider(color: Color(0xFF2A2A2A)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/creator-login');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: kAccentColor,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.login_rounded, color: Colors.black, size: 20),
                    SizedBox(width: 8),
                    Text('Sign In', style: TextStyle(color: Colors.black, fontSize: 15, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/signup');
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFF2A2A2A)),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.vpn_key_rounded, color: kAccentColor, size: 18),
                    const SizedBox(width: 8),
                    Text('Join with Invite Code',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showProfileSheet(BuildContext context, CreatorSession session) {
    showModalBottomSheet(
      context: context,
      backgroundColor: kSurfaceColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _ProfileSheetContent(session: session),
    );
  }
}

// ── Profile sheet ─────────────────────────────────────────────────────────────

class _ProfileSheetContent extends ConsumerStatefulWidget {
  final CreatorSession session;
  const _ProfileSheetContent({required this.session});

  @override
  ConsumerState<_ProfileSheetContent> createState() => _ProfileSheetContentState();
}

class _ProfileSheetContentState extends ConsumerState<_ProfileSheetContent> {
  List<Map<String, dynamic>>? _invites;
  bool _loadingInvites = false;

  @override
  void initState() {
    super.initState();
    _fetchInvites();
  }

  Future<void> _fetchInvites() async {
    setState(() => _loadingInvites = true);
    try {
      final ds = AuthRemoteDataSource(http.Client());
      final invites = await ds.fetchMyInvites(widget.session.accessToken);
      if (mounted) setState(() { _invites = invites; _loadingInvites = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingInvites = false);
    }
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied: $code'),
        backgroundColor: const Color(0xFF1E1E1E),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.session;
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 40,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          _Avatar(session: session, radius: 28),
          const SizedBox(height: 12),
          Text(session.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(session.email, style: TextStyle(color: Colors.white.withValues(alpha: 0.45), fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: kAccentColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(session.role, style: const TextStyle(color: kAccentColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, color: kAccentColor, size: 13),
                    const SizedBox(width: 3),
                    Text('${session.points} pts', style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _LevelSection(points: session.points),
          const SizedBox(height: 20),
          const Divider(color: Color(0xFF2A2A2A)),

          // ── Invite Codes ──────────────────────────────────────────────────
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.vpn_key_rounded, color: kAccentColor, size: 15),
              const SizedBox(width: 6),
              const Text(
                'Invite Codes',
                style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              if (_loadingInvites)
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(color: kAccentColor, strokeWidth: 1.5),
                ),
            ],
          ),
          const SizedBox(height: 10),
          if (_invites != null)
            ..._invites!.map((inv) {
              final used = inv['usedAt'] != null;
              final code = inv['code'] as String;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: used
                      ? Colors.white.withValues(alpha: 0.04)
                      : kAccentColor.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: used
                        ? Colors.white.withValues(alpha: 0.06)
                        : kAccentColor.withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        code,
                        style: TextStyle(
                          color: used ? Colors.white30 : kAccentColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          decoration: used ? TextDecoration.lineThrough : null,
                          decorationColor: Colors.white30,
                        ),
                      ),
                    ),
                    if (used)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Used', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.w600)),
                      )
                    else
                      GestureDetector(
                        onTap: () => _copyCode(code),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: kAccentColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.copy_rounded, color: kAccentColor, size: 12),
                              SizedBox(width: 4),
                              Text('Copy', style: TextStyle(color: kAccentColor, fontSize: 10, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 8),
          const Divider(color: Color(0xFF2A2A2A)),

          const SizedBox(height: 8),
          if (session.isAdmin)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.admin_panel_settings_rounded, color: kAccentColor, size: 20),
              title: const Text('Admin Panel', style: TextStyle(color: Colors.white, fontSize: 14)),
              onTap: () {
                Navigator.pop(context);
                context.push('/admin');
              },
            ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.logout, color: Colors.white54, size: 20),
            title: const Text('Sign out', style: TextStyle(color: Colors.white70, fontSize: 14)),
            onTap: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
    );
  }
}

// ── Level section ─────────────────────────────────────────────────────────────

class _LevelSection extends StatelessWidget {
  final int points;
  const _LevelSection({required this.points});

  @override
  Widget build(BuildContext context) {
    final info = getLevelInfo(points);
    final isMax = info.nextMin == null;

    final double progress = isMax
        ? 1.0
        : ((points - info.min) / (info.nextMin! - info.min)).clamp(0.0, 1.0);

    final String subLabel = isMax
        ? 'Max level reached'
        : '${info.nextMin! - points} pts to ${info.nextTitle}';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        LevelAvatar(level: info.level, size: 80),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: kAccentColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Lv.${info.level}',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      info.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 5,
                  backgroundColor: Colors.white.withValues(alpha: 0.1),
                  valueColor: const AlwaysStoppedAnimation<Color>(kAccentColor),
                ),
              ),
              const SizedBox(height: 5),
              Text(
                subLabel,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Avatar widgets ────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  final CreatorSession? session;
  final double radius;

  const _Avatar({this.session, this.radius = 20});

  @override
  Widget build(BuildContext context) {
    if (session == null) {
      return _AvatarShell(radius: radius, child: Icon(Icons.person, color: Colors.white54, size: radius));
    }
    if (session!.avatarUrl != null) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(session!.avatarUrl!),
        backgroundColor: kSurfaceColor,
      );
    }
    return _AvatarShell(
      radius: radius,
      backgroundColor: kAccentColor,
      child: Text(
        session!.name.isNotEmpty ? session!.name[0].toUpperCase() : '?',
        style: TextStyle(color: Colors.black, fontSize: radius * 0.8, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _AvatarShell extends StatelessWidget {
  final Widget child;
  final double radius;
  final Color? backgroundColor;

  const _AvatarShell({required this.child, this.radius = 20, this.backgroundColor});

  @override
  Widget build(BuildContext context) => CircleAvatar(
        radius: radius,
        backgroundColor: backgroundColor ?? kSurfaceColor,
        child: child,
      );
}
