class AccountItem {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final String role;
  final bool active;
  final String createdAt;
  final String? lastLoginAt;

  const AccountItem({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    required this.role,
    required this.active,
    required this.createdAt,
    this.lastLoginAt,
  });

  factory AccountItem.fromJson(Map<String, dynamic> json) => AccountItem(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        avatarUrl: json['avatarUrl'] as String?,
        role: json['role'] as String,
        active: json['active'] as bool,
        createdAt: json['createdAt'] as String,
        lastLoginAt: json['lastLoginAt'] as String?,
      );

  AccountItem copyWith({bool? active, String? role}) => AccountItem(
        id: id,
        name: name,
        email: email,
        avatarUrl: avatarUrl,
        role: role ?? this.role,
        active: active ?? this.active,
        createdAt: createdAt,
        lastLoginAt: lastLoginAt,
      );
}
