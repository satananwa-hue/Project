import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/data/datasources/auth_remote_data_source.dart';
import 'package:mobile/domain/entities/creator_session.dart';

const _tokenKey = 'creator_token';
const _sessionKey = 'creator_session';

const _storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

bool _isTokenExpired(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return true;
    final payload = parts[1];
    final padded = payload.padRight((payload.length + 3) & ~3, '=');
    final decoded = jsonDecode(utf8.decode(base64Url.decode(padded))) as Map<String, dynamic>;
    final exp = decoded['exp'];
    if (exp == null) return false;
    final expiry = DateTime.fromMillisecondsSinceEpoch((exp as int) * 1000);
    return DateTime.now().isAfter(expiry);
  } catch (_) {
    return true;
  }
}

final _authDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(http.Client());
});

class AuthNotifier extends AsyncNotifier<CreatorSession?> {
  @override
  Future<CreatorSession?> build() async {
    final token = await _storage.read(key: _tokenKey);
    final sessionJson = await _storage.read(key: _sessionKey);
    if (token == null || sessionJson == null) return null;
    if (_isTokenExpired(token)) {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _sessionKey);
      return null;
    }
    try {
      final map = jsonDecode(sessionJson) as Map<String, dynamic>;
      return CreatorSession.fromStoredJson(map, token);
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await ref.read(_authDataSourceProvider).login(email, password);
      await _storage.write(key: _tokenKey, value: session.accessToken);
      await _storage.write(key: _sessionKey, value: jsonEncode(session.toJson()));
      return session;
    });
  }

  Future<void> signup(String name, String email, String password, String inviteCode) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await ref.read(_authDataSourceProvider).signup(
        name: name,
        email: email,
        password: password,
        inviteCode: inviteCode,
      );
      await _storage.write(key: _tokenKey, value: session.accessToken);
      await _storage.write(key: _sessionKey, value: jsonEncode(session.toJson()));
      return session;
    });
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _sessionKey);
    state = const AsyncData(null);
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, CreatorSession?>(AuthNotifier.new);
