package pe.edu.upeu.lamb.matricula.service;

import org.junit.jupiter.api.Test;
import pe.edu.upeu.lamb.matricula.entity.BloqueoMatricula;
import pe.edu.upeu.lamb.matricula.exception.BusinessRuleException;
import pe.edu.upeu.lamb.matricula.mapper.BloqueoMatriculaMapper;
import pe.edu.upeu.lamb.matricula.mapper.CronogramaMatriculaMapper;
import pe.edu.upeu.lamb.matricula.repository.AmpliacionPlazoMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.BloqueoMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.CronogramaMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.VariacionMatriculaRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BloqueoYCronogramaServiceTest {

    @Test
    void levantarBloqueoActivoLoDesactivaYRepetirNoFalla() {
        BloqueoMatriculaRepository repo = mock(BloqueoMatriculaRepository.class);
        BloqueoMatriculaService servicio = new BloqueoMatriculaService(repo, mock(BloqueoMatriculaMapper.class));
        BloqueoMatricula bloqueo = BloqueoMatricula.builder().id(1L).activo(true).build();
        when(repo.findById(1L)).thenReturn(Optional.of(bloqueo));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        servicio.levantar(1L);
        servicio.levantar(1L);

        assertThat(bloqueo.getActivo()).isFalse();
        verify(repo).save(bloqueo);
    }

    @Test
    void noSeEliminaCronogramaConVariaciones() {
        CronogramaMatriculaRepository cronogramas = mock(CronogramaMatriculaRepository.class);
        VariacionMatriculaRepository variaciones = mock(VariacionMatriculaRepository.class);
        when(variaciones.existsByIdCronograma(3L)).thenReturn(true);
        CronogramaMatriculaService servicio = new CronogramaMatriculaService(cronogramas,
                mock(AmpliacionPlazoMatriculaRepository.class), variaciones, mock(CronogramaMatriculaMapper.class));

        assertThatThrownBy(() -> servicio.eliminar(3L)).isInstanceOf(BusinessRuleException.class);
        verify(cronogramas, never()).delete(any());
    }
}
