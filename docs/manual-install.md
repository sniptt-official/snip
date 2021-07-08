# Manual install

## macOS manual install

1.  Download the tarball using the `curl` command. The `-o` option specifies the file name that the downloaded tarball is written to. In this example, the file is written to `snip.tar.gz` in the current folder.

```sh
$ curl -L https://github.com/sniptt-official/snip-cli/releases/download/v0.0.49/snip-macos-x64.tar.gz -o snip.tar.gz
```

NOTE: You can install to any folder, or choose the recommended `/usr/local/snip-cli`.

To verify the integrity of the tarball, run the following command and check that the output matches the one on the relevant [release page](https://github.com/sniptt-official/snip-cli/releases/tag/v0.0.49).

```sh
$ sha256sum snip.tar.gz
```

2.  Extract the binary.

```sh
$ tar -xf snip.tar.gz
```

3.  Create a symlink to the user's `bin` folder.

```sh
$ sudo ln -sf snip /usr/local/bin/snip
```

NOTE: You must have write permissions to the specified folder. Creating a symlink to a folder that is already in your path eliminates the need to add the install folder to the user's `$PATH` variable.

4.  Verify the installation.

Assuming `/usr/local/bin` is on your `PATH`, you can now run:

```sh
$ snip --version
```

### Uninstall

1.  Find the folder that contains the symlink to the main binary.

```sh
$ which snip
/usr/local/bin/snip
```

2.  Using that information, run the following command to find the installation folder that the symlink points to.

```sh
$ ls -l /usr/local/bin/snip
lrwxr-xr-x  1 user  admin  4  4 Jun 16:20 /usr/local/bin/snip -> /folder/installed/snip-cli/snip
```

3.  Delete the symlink in the first folder. If your user account already has write permission to this folder, you don't need to use `sudo`.

```sh
$ sudo rm /usr/local/bin/snip
```

4.  Delete the main installation folder.

```sh
$ rm -rf /folder/installed/snip-cli
```

## Linux manual install

1.  Download the tarball using the `curl` command. The `-o` option specifies the file name that the downloaded tarball is written to. In this example, the file is written to `snip.tar.gz` in the current directory.

```sh
$ curl -L https://github.com/sniptt-official/snip-cli/releases/download/v0.0.49/snip-linux-x64.tar.gz -o snip.tar.gz
```

NOTE: You can install to any directory, or choose the recommended `/usr/local/snip-cli`.

To verify the integrity of the tarball, run the following command and check that the output matches the one on the relevant [release page](https://github.com/sniptt-official/snip-cli/releases/tag/v0.0.49).

```sh
$ shasum -a 256 snip.tar.gz
```

2.  Extract the binary.

```sh
$ tar -xf snip.tar.gz
```

3.  Create a symlink to the user's `bin` directory.

```sh
$ sudo ln -sf snip /usr/local/bin/snip
```

NOTE: You must have write permissions to the specified directory. Creating a symlink to a directory that is already in your path eliminates the need to add the install directory to the user's `$PATH` variable.

4.  Verify the installation.

Assuming `/usr/local/bin` is on your `PATH`, you can now run:

```sh
$ snip --version
```

### Uninstall

1.  Find the directory that contains the symlink to the main binary.

```sh
$ which snip
/usr/local/bin/snip
```

2.  Using that information, run the following command to find the installation directory that the symlink points to.

```sh
$ ls -l /usr/local/bin/snip
lrwxr-xr-x  1 user  admin  4  4 Jun 16:20 /usr/local/bin/snip -> /directory/installed/snip-cli/snip
```

3.  Delete the symlink in the first directory. If your user account already has write permission to this directory, you don't need to use `sudo`.

```sh
$ sudo rm /usr/local/bin/snip
```

4.  Delete the main installation directory.

```sh
$ rm -rf /directory/installed/snip-cli
```
