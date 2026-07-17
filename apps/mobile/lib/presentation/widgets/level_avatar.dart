import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mobile/core/utils/level_utils.dart';

class LevelAvatar extends StatelessWidget {
  final int level;
  final double size;

  const LevelAvatar({super.key, required this.level, required this.size});

  @override
  Widget build(BuildContext context) {
    final path = levelAssetPath(level);
    if (levelAssetIsSvg(level)) {
      return SvgPicture.asset(path, width: size, height: size, fit: BoxFit.contain);
    }
    return Image.asset(path, width: size, height: size, fit: BoxFit.contain);
  }
}
