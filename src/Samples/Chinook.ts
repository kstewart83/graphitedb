import * as path from 'path';
import * as bsql from 'better-sqlite3';
import GraphiteDB from '../GraphiteDB'
import IExistingSample from './IExistingSample';
import SampleLoader from './SampleLoader';

export class Chinook implements IExistingSample {

    static create():void {
        SampleLoader.createDbFromExisting(
            new Chinook(),
            path.join(__dirname, "..", "..", "data", "original", "sqlite", "chinook.sqlite"),
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "chinook.gdb")
        );
    }

    static load():GraphiteDB {
        return new GraphiteDB(
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "chinook.gdb")
        ).cloneToMemory();
    }

    getBasicMap(): any {
        return {
            albums: {
                "Title": ":album/title"
            },
            artists: {
                "Name": ":artist/name"
            },
            genres: {
                "Name": ":genre/name"
            },
            media_types: {
                "Name": ":media/type"
            },
            playlists: {
                "Name": ":playlists/name"
            },
            tracks: {
                "Name": ":track/name",
                "Composer": ":track/composer",
                "Milliseconds": ":track/milliseconds",
                "Bytes": ":track/bytes",
                "UnitPrice": ":track/unit-price"
            }
        }
    }

    getAlternateKeys(): any {
        return  {
            albums: ["Title"],
            artists: ["Name"],
            genres: ["Name"],
            media_types: ["Name"],
            playlists: ["Name"],
            tracks: ["Name", "Milliseconds"]
        };
    }

    getReferences(): any {
        return [
            {
                src: {table: "albums", column: "ArtistId"},
                tgt: {table: "artists", column: "ArtistId"},
                attr: ":album/artist"
            },
            {
                src: {table: "tracks", column: "AlbumId"},
                tgt: {table: "albums", column: "AlbumId"},
                attr: ":track/album"
            },
            {
                src: {table: "tracks", column: "MediaTypeId"},
                tgt: {table: "media_types", column: "MediaTypeId"},
                attr: ":track/media-type"
            },
            {
                src: {table: "tracks", column: "GenreId"},
                tgt: {table: "genres", column: "GenreId"},
                attr: ":track/genre"
            }
        ];
    }

    getLinks(): any {
        return [
            {
                table: "playlist_track",
                tgts: [
                    {table: "playlists", column: {src: "PlaylistId", tgt: "PlaylistId"}},
                    {table: "tracks", column: {src: "TrackId", tgt: "TrackId"}}
                ],
                attr: ":playlist/track"
            }
        ];
    }
}