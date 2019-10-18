/*****************************************************************************

  这里是 CryptoTest.js 页面加载时预读取的存放算法的脚本.

  scripts 是存放所有算法字符串的表, 键为算法名字符串, 值为算法对象. 其算法对象中, name 指示在页面中显示的算法名, value 指示算法本身, 应为函数对象或字符串, type 指示 value 是函数对象(function), 还是字符串(string).
  usable_encrypt_scripts 和 usable_decrypt_scripts 是指示程序在两个算法框中可选择的各个算法对象.

  本文件中的汉字请用 utf-8 编码.
  页面读取算法对象时, 若为函数则会自动加上函数名, 若为字符串则不做任何处理. 注意最好不要定义全局变量, 以避免 BUG.

******************************************************************************/

(function() {

var scripts = {
  "默认1": {
    "name": "默认1",
    "type": "function",
    "value":
function(text, key) {
  return text;
}
  },
  "默认2": {
    "name": "默认2",
    "type": "string",
    "value":
"function crypt(text, key) {\n" +
"  return text;\n" +
"}\n"
  },
  "Caesar加密": {
    "name": "Caesar加密",
    "type": "function",
    "value":
function(text, key) {
  function movealpha(c, d) {
    c = c.charCodeAt();
    if(c > 64 && c < 91) {
      return String.fromCharCode((c - 65 + d) % 26 + 65);
    } else if(c > 96 && c < 123) {
      return String.fromCharCode((c - 97 + d) % 26 + 97);
    } else {
      return c;
    }
  }

  var i;
  var outs = new Array("");
  for(i = 0; i < text.length; i++) {
    outs.push(movealpha(text[i], Number(key)));
  }
  return outs.join("");
}
  },
  "Playfair加密": {
    "name": "Playfair加密",
    "type": "function",
    "value":
function crypt(text, key) {
  key = key.toUpperCase();
  var i;
  
  // 原文中不要有多个k连写
  // k也不要写在两个相同字母中间
  // 也不能以k结尾
  // 若使用了矩阵中未使用的字母(为密钥中未使用的最后一个字母), 则会被替换为任意一个字母.
  
  // 生成密钥矩阵
  var K = [];
  for(i = 0; i < key.length; i++) {
    if(K.indexOf(key[i]) === -1 && /^[A-Z]$/.test(key[i])) {
    	K.push(key[i]);
    }
  }
  var alphabeta = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(i = 0; i < alphabeta.length; i++) {
    if(K.indexOf(alphabeta[i]) === -1) {
      K.push(alphabeta[i]);
    }
  }
  log(K.slice(0, 5));
  log(K.slice(5, 10));
  log(K.slice(10, 15));
  log(K.slice(15, 20));
  log(K.slice(20, 25));
  
  // 字母组加密
  function encrypt_core(a1, a2) {
    A1 = a1.toUpperCase();
    A2 = a2.toUpperCase();
    var i1 = K.indexOf(A1);
    var i2 = K.indexOf(A2);
    if(i1 == 25) i1 = Math.floor(Math.random() * 25);
    if(i2 == 25) i2 = Math.floor(Math.random() * 25);
    var tmp;
    if(i1 == -1 || i2 == -1 || i1 == i2) {
      throw '参数有误';
    }
    i1x = i1 % 5;
    i2x = i2 % 5;
    i1y = Math.floor(i1 / 5);
    i2y = Math.floor(i2 / 5);
    if(i1x == i2x) {
      i1y = (i1y + 1) % 5;
      i2y = (i2y + 1) % 5;
    } else if(i1y == i2y) {
      i1x = (i1x + 1) % 5;
      i2x = (i2x + 1) % 5;
    } else {
      tmp = i1x;
      i1x = i2x;
      i2x = tmp;
    }
    o1 = K[i1y * 5 + i1x];
    o2 = K[i2y * 5 + i2x];
    if(a1 >= 'a') {
      // 为小写
      o1 = o1.toLowerCase();
    }
    if(a2 >= 'a') {
      o2 = o2.toLowerCase();
    }
    return o1 + o2;
  }
  
  // 字母分组
  var T = [];
  var prevalphaidx = -1; // 标记一组字母的第一个字母的下标
  var alpha1, alpha2, retalpha;
  for(i = 0; i < text.length; i++) {
    if(/^[A-Z]$/i.test(text[i])) {
      if(prevalphaidx === -1) {
        // 第一个字母
        prevalphaidx = T.length;
        T.push(text[i]);
      } else {
        // 第二个字母
        alpha1 = T[prevalphaidx];
        alpha2 = text[i];
        if(alpha1 === alpha2) {
          // 相同时, 第二字母作为下一组的第一个字母, 第二字母用k填充
          retalpha = encrypt_core(alpha1, 'k');
          T.splice(prevalphaidx, 1, retalpha[0], retalpha[1]);
          prevalphaidx = T.length;
          T.push(alpha2);
        } else {
          retalpha = encrypt_core(alpha1, alpha2);
          T[prevalphaidx] = retalpha[0];
          T.push(retalpha[1]);
          prevalphaidx = -1;
        }
      }
    } else {
      // 非字母
      T.push(text[i]);
    }
  }
  if(prevalphaidx != -1) {
    // 最后多余出个字母的话加个k继续编码
    retalpha = encrypt_core(T[prevalphaidx], 'k');
    T.splice(prevalphaidx, 1, retalpha[0], retalpha[1]);
    prevalphaidx = -1;
  }
  
  // 结束
  return T.join('');
}
  },
  "Playfair解密": {
    "name": "Playfair解密",
    "type": "function",
    "value":
function(text, key) {
  key = key.toUpperCase();
  var i;
  
  // 生成密钥矩阵
  var K = [];
  for(i = 0; i < key.length; i++) {
    if(K.indexOf(key[i]) === -1 && /^[A-Z]$/.test(key[i])) {
    	K.push(key[i]);
    }
  }
  var alphabeta = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(i = 0; i < alphabeta.length; i++) {
    if(K.indexOf(alphabeta[i]) === -1) {
      K.push(alphabeta[i]);
    }
  }
  // log(K.slice(0, 5));
  // log(K.slice(5, 10));
  // log(K.slice(10, 15));
  // log(K.slice(15, 20));
  // log(K.slice(20, 25));
  
  // 字母组解密
  function encrypt_core(a1, a2) {
    A1 = a1.toUpperCase();
    A2 = a2.toUpperCase();
    var i1 = K.indexOf(A1);
    var i2 = K.indexOf(A2);
    if(i1 == 25) i1 = Math.floor(Math.random() * 25);
    if(i2 == 25) i2 = Math.floor(Math.random() * 25);
    var tmp;
    if(i1 == -1 || i2 == -1 || i1 == i2) {
      throw '参数有误';
    }
    i1x = i1 % 5;
    i2x = i2 % 5;
    i1y = Math.floor(i1 / 5);
    i2y = Math.floor(i2 / 5);
    if(i1x == i2x) {
      i1y = (i1y + 4) % 5;
      i2y = (i2y + 4) % 5;
    } else if(i1y == i2y) {
      i1x = (i1x + 4) % 5;
      i2x = (i2x + 4) % 5;
    } else {
      tmp = i1x;
      i1x = i2x;
      i2x = tmp;
    }
    o1 = K[i1y * 5 + i1x];
    o2 = K[i2y * 5 + i2x];
    if(a1 >= 'a') {
      // 为小写
      o1 = o1.toLowerCase();
    }
    if(a2 >= 'a') {
      o2 = o2.toLowerCase();
    }
    return o1 + o2;
  }
  
  // 字母分组
  var T = [];
  var prevalphaidx = -1; // 标记一组字母的第一个字母的下标
  var prevprevalpha1idx = -1; // 标记上一组字母的第一字母的下标
  var prevprevalpha2idx = -1; // 标记上一组字母的第二字母的下标
  var alpha1, alpha2, retalpha;
  for(i = 0; i < text.length; i++) {
    if(/^[A-Z]$/i.test(text[i])) {
      if(prevalphaidx === -1) {
        // 第一个字母
        prevalphaidx = T.length;
        T.push(text[i]);
      } else {
        // 第二个字母
        alpha1 = T[prevalphaidx];
        alpha2 = text[i];
        // 不考虑字母相同
        retalpha = encrypt_core(alpha1, alpha2);
        T[prevalphaidx] = retalpha[0];
        
        //log(T[prevprevalpha1idx] + ", " + T[prevprevalpha2idx]);
        
        if(prevprevalpha2idx != -1 && T[prevprevalpha1idx] === retalpha[0]) {
          // 除去相同字母中插入的k
          T.splice(prevprevalpha2idx, 1);
          prevalphaidx--;
        }
        
        prevprevalpha1idx = prevalphaidx;
        prevprevalpha2idx = T.length;
        T.push(retalpha[1]);
        prevalphaidx = -1;
      }
    } else {
      // 非字母
      T.push(text[i]);
    }
  }
  // 不考虑多出字母
  
  // 除去结尾的k
  if(T[prevprevalpha2idx] === 'k') {
    T.splice(prevprevalpha2idx, 1);
  }
  
  // 结束
  return T.join('');
}
  },
  "ASCII XOR加密": {
    "name": "ASCII XOR加密 生成十六进制数字组",
    "type": "function",
    "value":
function(text, key) {
  
  // 暂不支持中文
  
  var textidx, keyidx;
  var out = [];
  
  function toHex(n) {
    var s = n.toString(16).toUpperCase();
    if(s.length == 1) {
      s = "0" + s;
    }
    return s;
  }
  
  for(textidx = 0, keyidx = 0; textidx < text.length; textidx++, keyidx++) {
    if(keyidx == key.length) {
      keyidx = 0;
    }
    // log(text[textidx].charCodeAt() + " ^ " + key[keyidx].charCodeAt() + " = " + (text[textidx].charCodeAt() ^ key[keyidx].charCodeAt()));
    out.push(toHex(text[textidx].charCodeAt() ^ key[keyidx].charCodeAt()));
  }
  
  return out.join('');
}
  },
  "ASCII XOR解密": {
    "name": "ASCII XOR解密",
    "type": "function",
    "value":
function(text, key) {
  
  // 注释掉日志函数可以提高速度
  
  var textidx;
  var keyidx;
  var substr;
  var num;
  var out = [];
  for(textidx = 0, keyidx = 0; textidx < text.length; textidx += 2, keyidx++) {
    if(keyidx == key.length) {
      keyidx = 0;
    }
    substr = text.substr(textidx, 2);
    num = parseInt(substr, 16);
    log(num + " ^ " + key[keyidx].charCodeAt() + " = " + (num ^ key[keyidx].charCodeAt()));
    out.push(String.fromCharCode(num ^ key[keyidx].charCodeAt()));
  }
  return out.join('');
}
  }
};

// 可用的加密算法的列表
var usable_encrypt_scripts = [
  scripts["默认1"], scripts["Caesar加密"], scripts["Playfair加密"], scripts['ASCII XOR加密']
]

// 可用的解密算法的列表
var usable_decrypt_scripts = [
  scripts["默认2"], scripts["Caesar加密"], scripts["Playfair解密"], scripts["ASCII XOR解密"]
]

// 根对象
var _algo = {
  "usable_decrypt_scripts": usable_decrypt_scripts,
  "usable_encrypt_scripts": usable_encrypt_scripts
};

// 设置到全局
algorithm = _algo;
})();
