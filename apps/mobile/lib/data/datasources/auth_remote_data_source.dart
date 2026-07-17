import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/domain/entities/creator_session.dart';

class AuthRemoteDataSource {
  final http.Client _client;

  AuthRemoteDataSource(this._client);

  Future<CreatorSession> login(String email, String password) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/login');
    final res = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (res.statusCode == 200) {
      final json = jsonDecode(res.body) as Map<String, dynamic>;
      return CreatorSession.fromApiResponse(json);
    }

    String message = 'Login failed';
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      message = body['message'] as String? ?? message;
    } catch (_) {}

    if (res.statusCode == 401) throw Exception(message);
    throw Exception('$message (${res.statusCode})');
  }

  Future<List<Map<String, dynamic>>> fetchMyInvites(String token) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/invites/mine');
    final res = await _client.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Failed to load invites (${res.statusCode})');
  }

  Future<void> suggestVenue(Map<String, dynamic> body, String token) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/venues');
    final res = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode(body),
    );
    if (res.statusCode == 201) return;
    String message = 'Failed to submit venue';
    try {
      final b = jsonDecode(res.body) as Map<String, dynamic>;
      message = b['message'] as String? ?? message;
    } catch (_) {}
    throw Exception(message);
  }

  Future<CreatorSession> signup({
    required String name,
    required String email,
    required String password,
    required String inviteCode,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/signup');
    final res = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password, 'inviteCode': inviteCode}),
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      final json = jsonDecode(res.body) as Map<String, dynamic>;
      return CreatorSession.fromApiResponse(json);
    }

    String message = 'Sign up failed';
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      message = body['message'] as String? ?? message;
    } catch (_) {}
    throw Exception('$message (${res.statusCode})');
  }
}
