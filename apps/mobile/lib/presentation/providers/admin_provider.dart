import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/data/datasources/admin_remote_data_source.dart';
import 'package:mobile/domain/entities/account_item.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';

class AdminState {
  final List<AccountItem> accounts;
  final Map<String, int> stats;
  final bool loading;
  final String? error;

  const AdminState({
    this.accounts = const [],
    this.stats = const {'accounts': 0, 'venues': 0, 'reviews': 0, 'publishedVenues': 0, 'pendingVenues': 0},
    this.loading = false,
    this.error,
  });

  AdminState copyWith({
    List<AccountItem>? accounts,
    Map<String, int>? stats,
    bool? loading,
    String? error,
  }) =>
      AdminState(
        accounts: accounts ?? this.accounts,
        stats: stats ?? this.stats,
        loading: loading ?? this.loading,
        error: error,
      );
}

class AdminNotifier extends Notifier<AdminState> {
  @override
  AdminState build() {
    Future.microtask(fetchAll);
    return const AdminState(loading: true);
  }

  AdminRemoteDataSource get _ds {
    final token = ref.read(authProvider).asData?.value?.accessToken ?? '';
    return AdminRemoteDataSource(http.Client(), token);
  }

  Future<void> fetchAll() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final results = await Future.wait([_ds.fetchStats(), _ds.fetchAccounts()]);
      state = state.copyWith(
        stats: results[0] as Map<String, int>,
        accounts: results[1] as List<AccountItem>,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> createAccount({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    final account = await _ds.createAccount(
      name: name,
      email: email,
      password: password,
      role: role,
    );
    state = state.copyWith(
      accounts: [account, ...state.accounts],
      stats: {...state.stats, 'accounts': (state.stats['accounts'] ?? 0) + 1},
    );
  }

  Future<void> toggleActive(String id, bool active) async {
    // Optimistic update
    state = state.copyWith(
      accounts: state.accounts
          .map((a) => a.id == id ? a.copyWith(active: active) : a)
          .toList(),
    );
    try {
      await _ds.updateAccount(id, active: active);
    } catch (_) {
      // Revert on failure
      state = state.copyWith(
        accounts: state.accounts
            .map((a) => a.id == id ? a.copyWith(active: !active) : a)
            .toList(),
      );
    }
  }
}

final adminProvider =
    NotifierProvider<AdminNotifier, AdminState>(AdminNotifier.new);
