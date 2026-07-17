class CreatorSession {
  final String accessToken;
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final String role;
  final int points;

  const CreatorSession({
    required this.accessToken,
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    required this.role,
    this.points = 0,
  });

  bool get canCreate => true;
  bool get isAdmin => role == 'ADMINISTRATOR';

  factory CreatorSession.fromApiResponse(Map<String, dynamic> json) {
    final account = json['account'] as Map<String, dynamic>;
    return CreatorSession(
      accessToken: json['accessToken'] as String,
      id: account['id'] as String,
      name: account['name'] as String,
      email: account['email'] as String,
      avatarUrl: account['avatarUrl'] as String?,
      role: account['role'] as String,
      points: account['points'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'avatarUrl': avatarUrl,
        'role': role,
        'points': points,
      };

  factory CreatorSession.fromStoredJson(Map<String, dynamic> json, String token) {
    return CreatorSession(
      accessToken: token,
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String,
      points: json['points'] as int? ?? 0,
    );
  }
}
