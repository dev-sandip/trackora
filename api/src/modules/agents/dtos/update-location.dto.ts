import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 27.7172, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 85.324, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'Heading in degrees (0-360)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ example: 22.3, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}
