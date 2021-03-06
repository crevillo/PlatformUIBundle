<?php
/**
 * File containing the ComboLoader class.
 *
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\PlatformUIBundle\Loader;

use eZ\Publish\Core\Base\Exceptions\InvalidArgumentException;
use eZ\Publish\Core\Base\Exceptions\NotFoundException;

/**
 * ComboLoader combines JS or CSS files.
 */
class ComboLoader implements Loader
{
    /**
     * @var string Path to YUI build directory.
     */
    private $yuiBuildDirectory;

    /**
     * @var string Path to web directory.
     */
    private $webDirectory;

    /**
     * @param string $yuiBuildDirectory
     * @param string $webDirectory
     */
    public function __construct($yuiBuildDirectory, $webDirectory)
    {
        $this->yuiBuildDirectory = $yuiBuildDirectory;
        $this->webDirectory = $webDirectory;
    }

    public function combineFilesContent(array $files)
    {
        $content = '';

        foreach ($files as $file) {
            $ext = $this->findFileExtension($file);

            if ($ext === Loader::EXT_JS) {
                if ($this->isYuiFile($file)) {
                    $file = $this->fixUnresolvedPath($file);
                }

                $content .= $this->loadFile($file, $ext);
            } elseif ($ext === Loader::EXT_CSS) {
                $file = $this->fixUnresolvedPath($file);
                $content .= $this->loadFile($file, $ext);
            } else {
                throw new NotFoundException('file type', $file);
            }
        }

        return $content;
    }

    public function getCombinedFilesContentType(array $files)
    {
        $this->assertAtLeastOneFile($files);

        $file = $files[0];

        $ext = $this->findFileExtension($file);

        if ($ext === Loader::EXT_JS) {
            $type = 'application/javascript';
        } elseif ($ext === Loader::EXT_CSS) {
            $type = 'text/css';
        } else {
            throw new NotFoundException('file type', $file);
        }

        return $type;
    }

    /**
     * Asserts that files array is not empty.
     *
     * @param array $files
     *
     * @throws \eZ\Publish\Core\Base\Exceptions\InvalidArgumentException
     */
    private function assertAtLeastOneFile(array $files)
    {
        if (empty($files)) {
            throw new InvalidArgumentException('files', 'can not be empty');
        }
    }

    /**
     * Returns true if JS file is YUI file.
     *
     * @param $filename
     *
     * @return bool
     */
    private function isYuiFile($filename)
    {
        return $filename[0] !== '/';
    }

    /**
     * Fixes unresolved path.
     *
     * @param $filename
     *
     * @return string
     */
    private function fixUnresolvedPath($filename)
    {
        return $this->yuiBuildDirectory . $filename;
    }

    /**
     * Fixes filename for JS and CSS files.
     *
     * Replace underscores by dots.
     *
     * @param $filename
     * @param $ext
     *
     * @return string
     */
    private function fixFilename($filename, $ext)
    {
        return $this->webDirectory . str_replace('_' . $ext, '.' . $ext, $filename);
    }

    /**
     * Reads file from disk.
     *
     * @param $file
     * @param $ext
     *
     * @return string
     * @throws \eZ\Publish\Core\Base\Exceptions\NotFoundException
     */
    private function loadFile($file, $ext)
    {
        $filename = $this->fixFilename($file, $ext);

        if (!is_readable($filename)) {
            throw new NotFoundException('file', $file);
        }

        return file_get_contents($filename);
    }

    /**
     * Returns file extension.
     *
     * @param $file
     *
     * @return string
     */
    private function findFileExtension($file)
    {
        return substr(strrchr($file, '_'), 1);
    }
}
